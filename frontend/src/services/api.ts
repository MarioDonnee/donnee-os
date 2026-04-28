import axios from "axios";
import { supabase } from "./supabase";

export const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.detail?.code;

    if ((status === 401 || status === 403) && code !== "INSUFFICIENT_ROLE") {
      window.dispatchEvent(
        new CustomEvent("donnee:auth-error", {
          detail: {
            status,
            detail: error.response?.data?.detail,
          },
        }),
      );
    }

    return Promise.reject(error);
  },
);
