import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { USER_TOKEN, USER_KEY } from "./constants";

// Default error message when API errors occur
export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again later.";

// Base URL for API requests - get from environment variable or fallback to default
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8005";

// Create an Axios instance without static headers.
const api = axios.create({
  timeout: 4000 * 1000,
  baseURL: BASE_URL,
});

// Request interceptor to set dynamic headers before each request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(USER_TOKEN) ?? localStorage.getItem("_ms-mid") ?? "";
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
    const e: any = error?.response?.data;
    switch (error?.response?.status) {

      case 403: return null
      case 400:
      case 422:
      case 500:
      case 503:
      case 504:
      case 404:
        if (Array.isArray(e.detail)) {
          e.detail.forEach((obj: any) => {
            toast.error(obj.msg ?? DEFAULT_ERROR_MESSAGE);
          });
        } else {
          toast.error(e?.detail ?? DEFAULT_ERROR_MESSAGE);
        }
        break;
      case 401:
        console.log(e);
        toast.error(
          e?.detail ??
          "You're being logged out because your session has expired. Please re-login."
        );
        localStorage.removeItem(USER_TOKEN);
        localStorage.removeItem(USER_KEY);
        window.location.reload();
        break;
      default:
        toast.error(DEFAULT_ERROR_MESSAGE);
        break;
    }
    return Promise.reject(error.response);
  }
);

export default api;
