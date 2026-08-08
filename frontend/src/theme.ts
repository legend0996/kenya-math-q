// Dashboard theme colours — 20 selectable accents. Each palette maps the
// Tailwind "blue" utility classes to the chosen accent so the whole dashboard
// recolours. The colour is stored server-side (students.theme_color) and also
// cached in localStorage so it applies instantly on the next visit.
export interface Theme {
  name: string;
  c50: string;
  c100: string;
  c200: string;
  c300: string;
  c500: string;
  c600: string;
  c700: string;
}

const T = (name: string, c600: string, c700: string, c500: string, c100: string, c50: string, c200: string, c300: string): Theme => ({
  name, c50, c100, c200, c300, c500, c600, c700,
});

export const THEMES: Theme[] = [
  T("Royal", "#1e40af", "#1e3a8a", "#2563eb", "#dbeafe", "#eff6ff", "#bfdbfe", "#93c5fd"),
  T("Maroon", "#8b1e2d", "#6e1622", "#a22431", "#f3d9dd", "#faeef0", "#e7bcc4", "#d996a3"),
  T("Blue", "#2563eb", "#1d4ed8", "#3b82f6", "#dbeafe", "#eff6ff", "#bfdbfe", "#93c5fd"),
  T("Indigo", "#4f46e5", "#4338ca", "#6366f1", "#e0e7ff", "#eef2ff", "#c7d2fe", "#a5b4fc"),
  T("Violet", "#7c3aed", "#6d28d9", "#8b5cf6", "#ede9fe", "#f5f3ff", "#ddd6fe", "#c4b5fd"),
  T("Purple", "#9333ea", "#7e22ce", "#a855f7", "#f3e8ff", "#faf5ff", "#e9d5ff", "#d8b4fe"),
  T("Fuchsia", "#c026d3", "#a21caf", "#d946ef", "#fae8ff", "#fdf4ff", "#f5d0fe", "#f0abfc"),
  T("Pink", "#db2777", "#be185d", "#ec4899", "#fce7f3", "#fdf2f8", "#fbcfe8", "#f9a8d4"),
  T("Rose", "#e11d48", "#be123c", "#f43f5e", "#ffe4e6", "#fff1f2", "#fecdd3", "#fda4af"),
  T("Red", "#dc2626", "#b91c1c", "#ef4444", "#fee2e2", "#fef2f2", "#fecaca", "#fca5a5"),
  T("Orange", "#ea580c", "#c2410c", "#f97316", "#ffedd5", "#fff7ed", "#fed7aa", "#fdba74"),
  T("Amber", "#d97706", "#b45309", "#f59e0b", "#fef3c7", "#fffbeb", "#fde68a", "#fcd34d"),
  T("Yellow", "#ca8a04", "#a16207", "#eab308", "#fef9c3", "#fefce8", "#fef08a", "#fde047"),
  T("Lime", "#65a30d", "#4d7c0f", "#84cc16", "#ecfccb", "#f7fee7", "#d9f99d", "#bef264"),
  T("Green", "#16a34a", "#15803d", "#22c55e", "#dcfce7", "#f0fdf4", "#bbf7d0", "#86efac"),
  T("Emerald", "#059669", "#047857", "#10b981", "#d1fae5", "#ecfdf5", "#a7f3d0", "#6ee7b7"),
  T("Teal", "#0d9488", "#0f766e", "#14b8a6", "#ccfbf1", "#f0fdfa", "#99f6e4", "#5eead4"),
  T("Cyan", "#0891b2", "#0e7490", "#06b6d4", "#cffafe", "#ecfeff", "#a5f3fc", "#67e8f9"),
  T("Sky", "#0284c7", "#0369a1", "#0ea5e9", "#e0f2fe", "#f0f9ff", "#bae6fd", "#7dd3fc"),
  T("Slate", "#475569", "#334155", "#64748b", "#e2e8f0", "#f8fafc", "#cbd5e1", "#94a3b8"),
  T("Brown", "#92400e", "#78350f", "#b45309", "#fef3c7", "#fffbeb", "#fde68a", "#fcd34d"),
];

// Find a theme by its 600-colour hex (what the server stores), defaulting to Blue.
export function themeByColor(hex?: string | null): Theme {
  if (hex) {
    const hit = THEMES.find((t) => t.c600.toLowerCase() === hex.toLowerCase());
    if (hit) return hit;
  }
  return THEMES[0];
}

const STYLE_ID = "kmq-theme-style";
const STORAGE_KEY = "kmq_theme";

// Build the CSS that recolours the dashboard area. Every dashboard page wraps
// its content in an element with class "kmq-dashboard"; overriding the accent
// CSS variables on that scope recolours all the semantic utilities (bg-primary,
// text-cool-sky-300, etc.) used inside it, leaving the rest of the site blue.
function cssFor(t: Theme): string {
  return `
.kmq-dashboard{
--color-primary:${t.c700};
--color-primary-dark:${t.c700};
--color-primary-darker:${t.c700};
--color-primary-light:${t.c100};
--color-secondary:${t.c600};
--color-brandblue:${t.c600};
--color-brandblue-dark:${t.c700};
--color-brandblue-light:${t.c100};
--color-accent:${t.c600};
--color-accent-dark:${t.c700};
--color-accent-light:${t.c100};
--color-cool-sky-50:${t.c50};
--color-cool-sky-100:${t.c700};
--color-cool-sky-200:${t.c700};
--color-cool-sky-300:${t.c600};
--color-cool-sky-400:${t.c600};
--color-cool-sky-500:${t.c500};
--color-cool-sky-600:${t.c300};
--color-cool-sky-700:${t.c200};
--color-cool-sky-800:${t.c100};
--color-cool-sky-900:${t.c50};
--color-pumpkin-spice:${t.c700};
--color-pumpkin-spice-100:${t.c700};
--color-pumpkin-spice-200:${t.c700};
--color-pumpkin-spice-300:${t.c600};
--color-pumpkin-spice-400:${t.c600};
--color-pumpkin-spice-500:${t.c500};
--color-pumpkin-spice-600:${t.c500};
--color-pumpkin-spice-700:${t.c300};
--color-pumpkin-spice-800:${t.c200};
--color-pumpkin-spice-900:${t.c100};
--color-ghost-white-100:${t.c700};
--color-ghost-white-200:${t.c600};
--color-ghost-white-300:${t.c600};
--color-ghost-white-400:${t.c300};
--color-ghost-white-500:${t.c50};
}
`;
}

// Apply a theme and remember it locally.
export function applyTheme(t: Theme, persist = true) {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = cssFor(t);
  if (persist) localStorage.setItem(STORAGE_KEY, t.c600);
}

// Read the locally-cached theme (applied before React mounts to avoid a flash).
export function readSavedTheme(): Theme {
  if (typeof window === "undefined") return THEMES[0];
  return themeByColor(localStorage.getItem(STORAGE_KEY) || "");
}

// Re-apply whatever theme is saved locally (used on App mount).
export function applySavedTheme() {
  applyTheme(readSavedTheme(), false);
}

// Event used to tell the app (and any open tabs) that the theme changed.
export const THEME_EVENT = "kmq-theme-change";

export function emitThemeChange() {
  window.dispatchEvent(new CustomEvent(THEME_EVENT));
}