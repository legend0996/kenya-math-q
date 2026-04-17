// Central API utility for base URL
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function apiUrl(path: string) {
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}
