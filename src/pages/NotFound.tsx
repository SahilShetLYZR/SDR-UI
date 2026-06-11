import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-6 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="auth-orb absolute -left-24 -top-32 h-[26rem] w-[26rem] rounded-full bg-purple-500/35 blur-3xl" />
        <div className="auth-orb-slow absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="auth-grid absolute inset-0" />
        <div className="auth-noise absolute inset-0" />
      </div>

      <div className="relative z-10 max-w-md text-center">
        <p className="auth-reveal font-display text-7xl font-medium tracking-tight sm:text-8xl">
          4<em className="text-purple-300">0</em>4
        </p>
        <h1
          className="auth-reveal mt-4 font-display text-xl font-medium"
          style={{ animationDelay: "120ms" }}
        >
          Lost in the <em className="text-purple-300">pipeline.</em>
        </h1>
        <p
          className="auth-reveal mt-3 text-sm leading-relaxed text-white/70"
          style={{ animationDelay: "240ms" }}
        >
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="auth-reveal mt-8" style={{ animationDelay: "360ms" }}>
          <Link
            to="/"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-medium text-white shadow-lg shadow-purple-600/25 transition-colors hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
