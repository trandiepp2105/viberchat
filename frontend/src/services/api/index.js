import axios from "axios";
import { setupInterceptors } from "./interceptors";

// Create axios instance with default config
const api = axios.create({
  // Use relative URL for development to leverage the proxy
  baseURL: process.env.REACT_APP_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  // Important for CORS with credentials
  withCredentials: true,
});

// Set up request and response interceptors
setupInterceptors(api);

export default api;
