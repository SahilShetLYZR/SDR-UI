import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isDevMode, isLocalStudioAuth } from "@/utils/env";
import { loginWithGoogle } from "@/lib/studioAuth";

export const Login = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasTriggeredAuth = useRef(false);
  const previousPath = useRef(location.pathname);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    if (location.pathname.includes("/auth/login") && previousPath.current !== location.pathname) {
      hasTriggeredAuth.current = false;
      previousPath.current = location.pathname;
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleAuth = async () => {
      if (!isLoading && isAuthenticated) {
        const redirectPath = location.state?.from || "/";
        navigate(redirectPath);
        return;
      }

      if (!isLoading && !isAuthenticated && !hasTriggeredAuth.current && location.pathname.includes("/auth/login")) {
        hasTriggeredAuth.current = true;

        if (isDevMode()) {
          await checkAuth();
          return;
        }

        if (isLocalStudioAuth()) {
          await checkAuth();
          return;
        }

        console.log("Triggering auth modal");
        const { default: lyzr } = await import("lyzr-agent");
        await lyzr.init("pk_c14a2728e715d9ea67bf");
        await checkAuth();
      }
    };

    handleAuth();
  }, [isLoading, isAuthenticated, navigate, location, checkAuth]);

  const handleLoginClick = async () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    window.location.reload();
  };

  const handleStudioGoogleLogin = async () => {
    setIsSigningIn(true);
    setSignInError(null);
    try {
      const studioToken = await loginWithGoogle();
      if (!studioToken) {
        setSignInError("Sign-in window closed before completing. Try again.");
        return;
      }
      await checkAuth();
    } catch (err: any) {
      console.error("Studio Google sign-in failed:", err);
      setSignInError(err?.message ?? "Sign-in failed. Try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="relative mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-[400px] bg-white">
      {isLoading || isSigningIn ? (
        <p className="text-center text-gray-600">Please wait, authenticating...</p>
      ) : isLocalStudioAuth() ? (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-center text-gray-600">
            Sign in with your Lyzr Studio account
          </p>
          <button
            onClick={handleStudioGoogleLogin}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Continue with Google (Lyzr Studio)
          </button>
          {signInError && (
            <p className="text-center text-sm text-red-600">{signInError}</p>
          )}
          <button
            onClick={handleLoginClick}
            className="text-sm text-gray-500 underline hover:text-gray-700"
          >
            Reset session
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-center text-gray-600">
            Please login to continue
          </p>
          <button
            onClick={handleLoginClick}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Login / Sign Up
          </button>
        </div>
      )}
    </div>
  );
};
