export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
let csrfToken = "";

function getCsrfToken() {
  if (csrfToken) return csrfToken;
  if (typeof document === "undefined") return "";
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("csrf_token="))
    ?.slice("csrf_token=".length) ?? "";
}

export async function refreshCsrfToken() {
  const res = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
  if (!res.ok) {
    csrfToken = "";
    return "";
  }
  const body = await res.json().catch(() => ({}));
  csrfToken = String(body?.token ?? "");
  return csrfToken;
}

export async function authFetch(url, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const method = String(options.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  }
  return fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });
}
