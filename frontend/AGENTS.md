# Frontend — Vite + React

Static SPA built with Vite, React 19, React Router v7, Tailwind CSS v4.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — typecheck + production build to `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — ESLint

## Structure

- `src/pages/*.tsx` — route components (top-level routes)
- `src/pages/owner-dashboard/*.tsx` — admin subpages
- `src/components/` — shared components (`ui/` holds Button, Card, Badge, Input, Spinner)
- `src/utils/api.ts` — API client; base URL from `import.meta.env.VITE_API_URL`, falls back to `https://api.kenyamathquest.co.ke`
- `src/index.css` — global styles (Tailwind v4 `@import "tailwindcss"` + custom CSS)

## Conventions

- Routing lives in `src/App.tsx` (`<Routes>` under `BrowserRouter` in `src/main.tsx`). Add routes there.
- Use `react-router-dom`'s `Link`/`useNavigate` for navigation (no `next/*` imports).
- Use `<img>` or `src/components/Image.tsx` for images.
- Public assets live in `public/` and are served at `/`.
- Env vars use the `VITE_` prefix (e.g. `VITE_API_URL`).
