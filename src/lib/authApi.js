export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const AUTH_TOKEN_KEY = "taxi_admin_token";

export function getAuthToken() {
  if (typeof window === "undefined") return "";
  return String(window.localStorage.getItem(AUTH_TOKEN_KEY) ?? "");
}

export function setAuthToken(token) {
  if (typeof window === "undefined") return;
  const value = String(token ?? "").trim();
  if (!value) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_KEY, value);
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function authFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });
}
