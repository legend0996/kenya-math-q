// Central API utility for base URL
export const API_BASE = import.meta.env.VITE_API_URL || "https://api.kenyamathquest.co.ke";

export function apiUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

export const getToken = () => (typeof window === "undefined" ? "" : localStorage.getItem("token") || "");

export const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Download a protected endpoint as a file, sending the Bearer token in the
// Authorization header (window.open cannot attach headers).
export async function downloadAuthorized(path: string, filename?: string) {
  const res = await fetch(apiUrl(path), { headers: { Authorization: `Bearer ${getToken()}` } });
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

export function getUser(): { id?: number; role?: string; name?: string; school?: string; grade?: string } | null {
  try {
    const token = getToken();
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}
