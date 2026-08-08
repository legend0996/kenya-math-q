// Central API utility for base URL
export const API_BASE = import.meta.env.VITE_API_URL || "https://api.kenyamathquest.kenyamathsquest.co.ke";

export function apiUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

// 🔐 Session lives in an httpOnly cookie set by the backend — never in JS/localStorage.
// Patch fetch once so every API request carries the cookie (credentials: "include").
if (typeof window !== "undefined" && !window.__kmqFetchPatched) {
  window.__kmqFetchPatched = true;
  const origFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const reqUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input && typeof (input as Request).url === "string"
            ? (input as Request).url
            : "";
    const isApi = reqUrl === "" || reqUrl.startsWith(API_BASE) || reqUrl.startsWith("/api/") || reqUrl.startsWith("/uploads/");
    return origFetch(input, isApi ? { credentials: "include", ...(init || {}) } : init);
  };
}

declare global {
  interface Window {
    __kmqFetchPatched?: boolean;
  }
}

export interface UserInfo {
  id?: number;
  role?: string;
  name?: string;
  school?: string;
  grade?: string;
  phone?: string;
  email?: string;
}

let cachedUser: UserInfo | null = null;
let cachePromise: Promise<UserInfo | null> | null = null;

// Set the current user directly (used after login).
export const setUser = (u: UserInfo | null) => {
  cachedUser = u;
  cachePromise = null;
};

// Synchronous read of the last loaded user (may be null until fetchMe resolves).
export const getUser = (): UserInfo | null => cachedUser;

let lastLoad = 0;

// Load the current user from /api/auth/me using the httpOnly cookie.
export async function fetchMe(force = false): Promise<UserInfo | null> {
  const now = Date.now();
  if (!force && cachePromise && now - lastLoad < 30_000) return cachePromise;
  lastLoad = now;
  cachePromise = (async () => {
    try {
      const res = await fetch(apiUrl("/api/auth/me"), { credentials: "include" });
      if (!res.ok) {
        cachedUser = null;
        return null;
      }
      const d = await res.json();
      cachedUser = (d?.user as UserInfo) || null;
      return cachedUser;
    } catch {
      cachedUser = null;
      return null;
    }
  })();
  return cachePromise;
}

// Headers for JSON requests — auth rides on the cookie, no Authorization header.
export const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
});

// Download a protected endpoint as a file using the httpOnly cookie.
export async function downloadAuthorized(path: string, filename?: string) {
  const res = await fetch(apiUrl(path), { credentials: "include" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || path.split("/").pop() || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Log out: tell the server to clear the cookie, then reset local user state.
export async function logout() {
  try {
    await fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "include" });
  } catch {
    // ignore network errors — still drop local state
  }
  cachedUser = null;
  cachePromise = null;
}