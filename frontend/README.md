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

- `src/App.tsx` — route definitions
- `src/pages/` — route components (top-level and `owner-dashboard/`)
- `src/components/` — shared components (`ui/` holds Button, Card, Badge, Input, Spinner)
- `src/utils/api.ts` — API client
- `public/` — static assets (`logo.jpeg`, `favicon.ico`)
