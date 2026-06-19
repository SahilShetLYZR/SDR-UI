import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { USER_TOKEN, USER_KEY } from "./constants";

// Default error message when API errors occur
export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again later.";

// Base URL for API requests - get from environment variable or fallback to default
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Create an Axios instance without static headers.
// 60s timeout: long enough for AI generation/uploads, short enough that a
// hung request settles its loading state instead of spinning for an hour.
const api = axios.create({
  timeout: 60 * 1000,
  baseURL: BASE_URL,
});

// Request interceptor to set dynamic headers before each request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(USER_TOKEN) ?? "";
    const apiKey = localStorage.getItem(USER_KEY) ?? "";
    // Set Authorization header with bearer token.
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      // Set the x-api-key header with the API key.
      config.headers["x-api-key"] = apiKey;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // No response at all = the request never reached the server (network
    // error, CORS, timeout, blocked by a service worker). Rejecting with
    // `error.response` here would hand callers `undefined` — the cryptic
    // "Error fetching campaigns: undefined" you see on prod. Surface a real
    // message and reject with the actual error so it stays debuggable.
    if (!error?.response) {
      toast.error(
        "Couldn't reach the server. Check your connection and try again."
      );
      return Promise.reject(error);
    }

    switch (error?.response?.status) {
      case 403:
        // Reject (below) instead of swallowing: returning null resolved the
        // promise with no response, crashing callers and stranding loaders.
        toast.error("You don't have permission to do that.");
        break;
      case 400:
      case 422:
        // Form-level failures are the calling component's job to explain
        // (with field context the global handler doesn't have). No global
        // toast — and never the raw backend detail / pydantic "Field
        // required" strings.
        break;
      case 404:
        toast.error("We couldn't find what you were looking for.");
        break;
      case 500:
      case 503:
      case 504:
        toast.error("Something went wrong on our end. Please try again in a moment.");
        break;
      case 401: {
        // Background probes (e.g. the admin check) opt out: a 401 from an
        // optional endpoint must not end the whole session.
        if ((error.config as any)?.skipAuthRedirect) break;
        // Loop guard: if we already redirected for a 401 in the last 10s,
        // the session is being rebuilt — redirecting again just cycles the
        // app through login forever (the "continuous loading" bug).
        const lastRedirect = Number(sessionStorage.getItem("jazon_401_at") ?? 0);
        if (Date.now() - lastRedirect < 10_000) break;
        sessionStorage.setItem("jazon_401_at", String(Date.now()));
        toast.error(
          "You're being logged out because your session has expired. Please re-login."
        );
        localStorage.removeItem(USER_TOKEN);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem("user_id");
        localStorage.removeItem("USER_DATA");
        if (!window.location.pathname.startsWith("/auth/login")) {
          window.location.replace("/auth/login");
        }
        break;
      }
      default:
        toast.error(DEFAULT_ERROR_MESSAGE);
        break;
    }
    return Promise.reject(error.response);
  }
);

export default api;
