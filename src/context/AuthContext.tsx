// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { USER_KEY, USER_TOKEN } from "@/lib/constants";
import { isDevMode, isLocalStudioAuth } from "@/utils/env";
import {
  buildStudioSession,
  getStudioToken,
  studioLogout,
} from "@/lib/studioAuth";

// The token data returned by the SDK.getKeys() call.
interface TokenData {
  user_id: string;
  api_key: string;
}

interface Permission {
  id: string;
  name: string;
  created_at: string | null;
  type: string;
  resource_id: string;
  owner_id: string | null;
  disabled: boolean;
  modes: string[] | null;
}

// Example shape from SDK.getKeysUser() if it includes permissions now.
interface SdkUserData {
  data: {
    org_id: string;
    available_credits: string;
    policy?: {
      permissions?: Permission[];
      user_id: string;
      org_id: string;
      role: string;
    };
    user: {
      user_id: string;
      email: string;
      organization_ids: string[];
      current_org_id: string;
    };
  };
}

interface UserType {
  email: string;
  user_id: string;
  organization_ids: string[];
  current_org_id: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  token: string | null;
  user: UserType | null;
  hasJazonAccess: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  token: null,
  user: null,
  hasJazonAccess: false,
  checkAuth: async () => {},
  logout: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [hasJazonAccess, setHasJazonAccess] = useState(false);
  const isInitializedRef = useRef(false);
  // A helper to re-check authentication when called.
  // Real Studio session for local dev (VITE_LOCAL_STUDIO_AUTH=true):
  // Memberstack token from the cookie/popup -> Pagos keys + user. No SDK,
  // no studio.lyzr.ai redirect, no agent provisioning.
  const checkStudioLocalAuth = async () => {
    try {
      setIsInitializing(true);
      const studioToken = await getStudioToken();
      if (!studioToken) {
        handleAuthFailure();
        return;
      }
      const session = await buildStudioSession(studioToken);
      if (!session) {
        console.warn("Studio token present but Pagos session could not be built");
        handleAuthFailure();
        return;
      }
      localStorage.setItem(USER_KEY, session.apiKey);
      localStorage.setItem(USER_TOKEN, studioToken);
      localStorage.setItem("user_id", session.user.user_id);
      localStorage.setItem("USER_DATA", JSON.stringify(session.user));
      setIsAuthenticated(true);
      setUserId(session.user.user_id);
      setToken(studioToken);
      setUser(session.user);
      setHasJazonAccess(session.hasJazonAccess);
    } catch (err) {
      console.error("Local Studio auth failed:", err);
      handleAuthFailure();
    } finally {
      setIsInitializing(false);
      setIsLoading(false);
    }
  };

  // VITE_DEV_MODE: documented dummy-cred bypass (pair with backend
  // DEV_MODE=true, which ignores the values — they just need to exist).
  const signInDevUser = () => {
    const devUser: UserType = {
      email: "krish@lyzr.ai",
      user_id: "dev-user",
      organization_ids: ["dev-org"],
      current_org_id: "dev-org",
    };
    localStorage.setItem(USER_KEY, "dev-api-key");
    localStorage.setItem(USER_TOKEN, "dev-token");
    localStorage.setItem("user_id", devUser.user_id);
    localStorage.setItem("USER_DATA", JSON.stringify(devUser));
    setIsAuthenticated(true);
    setUserId(devUser.user_id);
    setToken("dev-token");
    setUser(devUser);
    setHasJazonAccess(true);
    setIsLoading(false);
  };

  const checkAuth = async () => {
    if (isInitializing) return; // Prevent multiple simultaneous checks
    if (isDevMode()) {
      signInDevUser();
      return;
    }
    if (isLocalStudioAuth()) {
      await checkStudioLocalAuth();
      return;
    }

    try {
      setIsInitializing(true);
      const { default: lyzr } = await import("lyzr-agent");

      // 1. Get basic token data: API key + user_id
      const tokenData = (await lyzr.getKeys()) as unknown as TokenData[];

      if (tokenData && tokenData[0]) {
        // 2. Get additional user details + bearer token
        const sdkUserData = (await lyzr.getKeysUser()) as SdkUserData;
        console.log("SDK user data:", tokenData[0]);

        // Check Jazon permission directly from the SDK data
        const jazonAccess =
          sdkUserData?.data?.policy?.permissions?.some(
            (permission) =>
              permission.id === "jazon" &&
              permission.type === "app" &&
              permission.resource_id === "jazon" &&
              !permission.disabled &&
              permission.modes?.includes("READ")
          ) ?? false;

        // Save localStorage items
        localStorage.setItem(USER_KEY, tokenData[0].api_key);
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("token");
        if (urlToken) {
          localStorage.setItem(USER_TOKEN, urlToken);
        }
        localStorage.setItem("user_id", tokenData[0].user_id);

        // Build a user object
        const userObj: UserType = {
          email: sdkUserData.data.user.email,
          user_id: sdkUserData.data.user.user_id,
          organization_ids: sdkUserData.data.user.organization_ids,
          current_org_id: sdkUserData.data.user.current_org_id,
        };

        localStorage.setItem("USER_DATA", JSON.stringify(userObj));

        // Only update state if not already authenticated or if token changed
        if (!isAuthenticated || urlToken !== token) {
          setIsAuthenticated(true);
          setUserId(tokenData[0].user_id);
          setToken(urlToken || sdkUserData.data.org_id);
          setUser(userObj);
          setHasJazonAccess(jazonAccess);
        }
      } else {

        console.warn("No valid token data found from lyzr.getKeys()");
        
        handleAuthFailure();

        // lyzr.init("pk_c14a2728e715d9ea67bf"); // Re-init to trigger login modal
        isInitializedRef.current = true// Reset initialization flag

      }
    } catch (err) {
              console.warn("No valid token data found from lyzr.getKeys()22");

      console.error("Auth check failed:", err);
      handleAuthFailure();
    } finally {
      setIsInitializing(false);
      setIsLoading(false);
    }
  };

  // Called if authentication fails or if user logs out
  const handleAuthFailure = () => {
    setIsAuthenticated(false);
    setUserId(null);
    setToken(null);
    setUser(null);
    setHasJazonAccess(false);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_TOKEN);
    localStorage.removeItem("user_id");
    localStorage.removeItem("USER_DATA");
  };

  // Add a logout function that ends the upstream session + clears local data
  const logout = async () => {
    try {
      if (isLocalStudioAuth()) {
        await studioLogout();
      } else if (!isDevMode()) {
        const { default: lyzr } = await import("lyzr-agent");
        await lyzr.logout(); // log out from the SDK
      }
    } catch (err) {
      console.error("Failed to log out:", err);
    } finally {
      handleAuthFailure();
      setIsLoading(false);
      // Hard navigation to a fresh login screen. Re-initializing the SDK
      // in place used to leave the app in a half-cleared "Redirecting..."
      // dead end (SDK modal hides #root); a full reload guarantees clean
      // module + auth state no matter which auth mode is active.
      window.location.replace("/auth/login");
    }
  };

  // Attempt to load stored auth info on route changes.
  useEffect(() => {
    const storedKey = localStorage.getItem(USER_KEY);
    const storedBearerToken = localStorage.getItem(USER_TOKEN);
    const storedUserData = localStorage.getItem("USER_DATA");

    // Dev placeholder creds left over from a VITE_DEV_MODE session are
    // worthless against the real backend — resurrecting them produces an
    // endless stream of 401s (backend re-verifies "dev-api-key" against
    // Pagos on every request). Purge instead of restoring.
    if (!isDevMode() && (storedKey === "dev-api-key" || storedBearerToken === "dev-token")) {
      handleAuthFailure();
      return;
    }

    if (storedKey && storedBearerToken && storedUserData && !isAuthenticated) {
      try {
        const parsedUser = JSON.parse(storedUserData) as UserType;
        setUser(parsedUser);
        setIsAuthenticated(true);
        setToken(storedBearerToken);
      } catch (error) {
        console.error("Error parsing stored user data", error);
      }
    }
  }, []);

  // Initialize the SDK and set up an auth state listener.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      if (isInitializedRef.current) return; // Use persistent ref

      // Local dev bypass: dummy session, no Studio round-trip at all.
      if (isDevMode()) {
        isInitializedRef.current = true;
        signInDevUser();
        return;
      }

      // Local real-Studio auth: resume an existing Memberstack session if
      // one exists; otherwise land on /auth/login where the Google popup
      // sign-in lives. The lyzr-agent SDK is never initialized (its modal
      // hides #root and only offers the broken localhost redirect).
      if (isLocalStudioAuth()) {
        isInitializedRef.current = true;
        await checkStudioLocalAuth();
        return;
      }

      try {
        const { default: lyzr } = await import("lyzr-agent");

        await lyzr.init("pk_c14a2728e715d9ea67bf");
        isInitializedRef.current = true; // Mark as initialized

        unsubscribe = lyzr.onAuthStateChange((sdkAuthState) => {
          if (sdkAuthState && !isAuthenticated) {
            checkAuth();
          } else if (!sdkAuthState) {
            handleAuthFailure();
          }
        });

        // Only check auth if not already authenticated
        if (!isAuthenticated) {
          await checkAuth();
        }
      } catch (err) {
        console.error("Initialization failed:", err);
        setIsLoading(false);
      }
    };

    init();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userId,
        token,
        user,
        hasJazonAccess,
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}