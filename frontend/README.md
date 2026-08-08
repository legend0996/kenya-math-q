# Kenya Math Quest — Frontend

Static React single-page app for the Kenya Math Quest national mathematics competition. Built with Vite, React 19, React Router v7, Tailwind CSS v4, and Zustand.

## Getting Started

```bash
npm install
npm run dev
```

Open the printed localhost URL (default `http://localhost:5173`).

## Building

```bash
npm run build
```

Outputs a fully static site to `dist/` (single `index.html` + hashed assets). No per-route HTML files are generated.

## Deploying

The app is a client-side SPA. Host the contents of `dist/` on any static host and add a fallback to `index.html` for unknown paths:

- **Shared hosting (Apache)**: put `dist/` contents in the web root and add an `.htaccess`:
  ```apache
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.html [L]
  ```
- **Nginx**:
  ```nginx
  location / {
    try_files $uri /index.html;
  }
  ```

Point the frontend at the API by setting `VITE_API_URL` at build time (e.g. in `.env.production`); it falls back to `https://api.kenyamathquest.co.ke`.

## Structure

- `src/App.tsx` — route definitions + global widgets (`ChatbotWidget`, floating `CalculatorWidget`)
- `src/pages/` — route components (top-level and `owner-dashboard/`)
- `src/components/` — shared components (`ui/` holds Button, Card, Badge, Input, Spinner, Alert, Modal, EmptyState; also working/canvas widgets and `Countdown`)
- `src/store/contestStore.ts` — Zustand contest state
- `src/theme.ts` — 20-colour dashboard theme system (scoped CSS-variable overrides under `.kmq-dashboard`)
- `src/index.css` — Blue Academic design tokens (Tailwind v4 `@theme`)
- `src/utils/api.ts` — API client
- `public/` — static assets (favicons, `site.webmanifest`, `logo.jpeg`)

## Design

The app uses a **Blue Academic** design language: solid colours only (no gradients, no emojis, no glassmorphism), Inter font, 12–16px rounded corners, soft shadows, and blue-only charts. Every colour is a semantic token in `src/index.css` (e.g. `--color-primary: #1e3a8a`), so utilities like `bg-primary` or `text-cool-sky-300` resolve through CSS variables.

The per-user dashboard theme recolours those variables **only inside dashboard pages**: each dashboard's root `<main>` carries the `kmq-dashboard` class, and `theme.ts` injects a stylesheet redefining the accent variables on that scope. Non-dashboard (marketing) pages always stay blue.
