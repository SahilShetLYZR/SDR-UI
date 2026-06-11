import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isDevMode, isLocalStudioAuth } from "@/utils/env";
import { loginWithGoogle } from "@/lib/studioAuth";

const GoogleMark = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.44.35-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.16-3.16A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const Login = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasTriggeredAuth = useRef(false);
  const previousPath = useRef(location.pathname);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Reset auth trigger when navigating to login page
  useEffect(() => {
    if (location.pathname.includes("/auth/login") && previousPath.current !== location.pathname) {
      hasTriggeredAuth.current = false;
      previousPath.current = location.pathname;
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleAuth = async () => {
      // If already authenticated, redirect
      if (!isLoading && isAuthenticated) {
        const redirectPath = location.state?.from || "/";
        navigate(redirectPath);
        return;
      }

      // Trigger auth when not authenticated and on login page
      if (!isLoading && !isAuthenticated && !hasTriggeredAuth.current && location.pathname.includes("/auth/login")) {
        hasTriggeredAuth.current = true;
        // Local dev: authenticate without the Lyzr Studio SDK / redirect.
        if (isDevMode()) {
          await checkAuth();
          return;
        }
        // Local Studio auth: a popup needs a user gesture, so just resume
        // any existing session here and otherwise wait for the button click.
        if (isLocalStudioAuth()) {
          await checkAuth();
          return;
        }
        console.log("Triggering auth modal");
        // Re-initialize SDK and trigger auth
        const { default: lyzr } = await import("lyzr-agent");
        await lyzr.init("pk_c14a2728e715d9ea67bf");
        await checkAuth();
      }
    };

    handleAuth();
  }, [isLoading, isAuthenticated, navigate, location, checkAuth]);

  const handleLoginClick = async () => {
    // Clear all auth-related storage
    localStorage.clear();
    sessionStorage.clear();
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    window.location.reload();
  };

  // Local Studio sign-in: Memberstack Google popup (works on localhost,
  // unlike the studio.lyzr.ai redirect), then build the Pagos session.
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
    <div className="auth-reveal mx-auto flex w-full max-w-sm flex-col">
      {isLoading || isSigningIn ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <p className="text-sm text-zinc-500">Signing you in…</p>
        </div>
      ) : (
        <>
          <p className="font-display text-sm italic text-purple-600">
            Welcome back
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            Sign in to Jazon
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            {isLocalStudioAuth()
              ? "Use your Studio account to pick up your pipeline where you left off."
              : "Log in with your Lyzr account to pick up your pipeline where you left off."}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {isLocalStudioAuth() ? (
              <button
                onClick={handleStudioGoogleLogin}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              >
                <GoogleMark />
                Continue with Google
                <span className="text-zinc-400">· Lyzr Studio</span>
              </button>
            ) : (
              <button
                onClick={handleLoginClick}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              >
                Login / Sign up
              </button>
            )}

            {signInError && (
              <p role="alert" className="text-center text-sm text-red-600">
                {signInError}
              </p>
            )}
          </div>

          
        </>
      )}
    </div>
  );
};
