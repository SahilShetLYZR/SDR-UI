import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const Login = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasTriggeredAuth = useRef(false);
  const previousPath = useRef(location.pathname);

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

  return (
    <div className="relative mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-[400px] bg-white">
      {isLoading ? (
        <p className="text-center text-gray-600">Please wait, authenticating...</p>
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
