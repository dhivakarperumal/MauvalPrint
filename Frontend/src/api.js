import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL;
const productionApiUrl = rawApiUrl
  ? rawApiUrl.replace(/\/+$/, "")
  : `${window.location.origin}/api`;

export const API_URL = import.meta.env.MODE === "development"
  ? "/api"
  : productionApiUrl;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;