# Kenya Math Quest

National online mathematics competition platform for Kenyan schools. Students register, pay, sit a timed, randomised exam, and receive certificates; schools and administrators manage contests, questions, revision materials and results.

Monorepo with two apps:

| Folder      | Stack                                              | Role                              |
|-------------|----------------------------------------------------|-----------------------------------|
| `backend/`  | Node.js, Express 5, MySQL 8 (mysql2), JWT, PDFKit | REST API, auth, payments, marking |
| `frontend/` | Vite, React 19, React Router v7, Tailwind CSS v4    | Static SPA (student + admin)      |

---

## Features

- **Student portal** — register, pay (M-PESA STK or manual), sit the exam, view results, certificates and study materials, custom dashboard colour.
- **Exam engine** — one question at a time, per-student randomised order (resume-safe seed), server-enforced timer, auto-submit on timeout, tab-switch detection, screenshot/print protection.
- **Marking** — auto-grading for multiple-choice / exact answers and one-click **auto-mark a whole grade** (compares admin answer vs student answer). Manual per-question marking with percentage/grade too.
- **Tuition page** — public `/tuition` page streaming YouTube lessons added by the admin (link + name + description).
- **20 dashboard themes** — students pick their accent colour, stored per user and applied instantly.
- **Certificates** — template designer + PDF generation, shown and downloadable on the dashboard (email optional).
- **Admin dashboard** — contests, per-grade exam times/days, questions, materials, payments, parents, results, certificates, admins.
- **Parent & school dashboards**, leaderboard, support assistant.

---

## Project structure

```
kenya-math-q/
├── backend/
│   ├── index.js              # Express app entry, route mounting
│   ├── runMigrations.js      # DB schema + versioned migrations runner
│   ├── migrations/           # versioned SQL migrations (001..009)
│   ├── config/db.js          # MySQL pool (DATABASE_URL or DB_* env)
│   ├── controllers/          # route handlers
│   ├── middleware/           # JWT / owner auth
│   ├── routes/               # Express routers
│   ├── utils/                # emailService, daraja (M-Pesa), etc.
│   └── uploads/              # materials, certificate PDFs (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # routes
│   │   ├── pages/            # route components (+ owner-dashboard/)
│   │   ├── components/       # shared components (ui/, canvas, widgets)
│   │   ├── theme.ts          # 20-colour dashboard theme system
│   │   └── utils/api.ts      # API client (VITE_API_URL)
│   └── dist/                 # production build output
└── ecosystem.config.cjs      # PM2 cluster config (backend)
```

---

## Getting started

Requires **Node.js 18+** and a **MySQL** database. Two terminals (backend + frontend).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in real values (see below)
node runMigrations.js  # create/update the database schema
npm run dev            # or: node index.js
```

Key environment variables (`backend/.env`):

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` / `MYSQL_URL` | Single MySQL connection URL (preferred). Fallback to `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. |
| `PORT`, `NODE_ENV`, `PUBLIC_URL`, `JWT_SECRET` | Server port, environment, callback URL, JWT signing secret. |
| `FRONTEND_ORIGINS` | Comma-separated allowed CORS origins. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `EMAIL_NAME` | Optional email. Required for certificate/reset emails. Certificates still work via dashboard without it. |
| `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`, `MPESA_ENV`, `MPESA_AMOUNT` | M-Pesa Daraja STK push (leave blank to use manual proof submission). |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev            # Vite dev server
```

Set `VITE_API_URL` (in `frontend/.env` or `.env.production`) to the backend URL; it defaults to `https://api.kenyamathquest.co.ke`.

Open the printed localhost URL (default `http://localhost:5173`).

---

## Database migrations

Run migrations whenever the repo adds a new `backend/migrations/*.sql` file:

```bash
cd backend && node runMigrations.js
```

Migrations are tracked in the `schema_migrations` table and applied once each (baseline `migrations.sql` plus versioned files `001`–`009`).

---

## Building & deploying

- **Frontend**: `npm run build` outputs a static SPA to `frontend/dist/`. Host it and add a fallback to `index.html` for unknown paths (Apache `.htaccess` or Nginx `try_files`). See `frontend/README.md`.
- **Backend**: run with a process manager, e.g. PM2 cluster:

  ```bash
  npx pm2 start ecosystem.config.cjs && npx pm2 save
  ```

---

## Key flows

- **Registration & payment** — students register and pay via M-PESA STK (auto-confirms) or manual proof (shows as *M-PESA Unconfirmed — awaiting admin approval* until an admin approves).
- **Exam** — a student starts the paper, sees instructions (optional per grade), then one randomised question at a time. Answers auto-save as a draft that can be resumed. On timeout or manual submit the exam is finalised (auto-graded for MCQ/manual modes or queued for admin marking).
- **Marking** — an admin picks a contest → **grade**, presses **Marks**, and the backend compares each student's final answer to the correct answer and awards full marks on every match.
- **Tuition** — admins add revisions as *YouTube video*, which are streamed on the public `/tuition` page.
- **Dashboard theme** — 20 swatches on the dashboard; the chosen colour recolours the whole dashboard and persists per user.

---

## License

Proprietary — © Kenya Math Quest.