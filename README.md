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
- **Exam engine** — one question at a time, per-student randomised order (resume-safe seed), server-enforced timer, auto-submit on timeout, tab-switch detection, screenshot/print protection, per-contest compulsory instructions shown before the timer starts.
- **Exam review** — students can review their submitted paper after an admin marks it reviewable, including per-question marks and grade.
- **Marking modes** — each contest runs in **auto** or **manual** mode (switchable from the admin marking screen). Auto mode grades MCQ/exact answers; manual mode is per-question with percentage/grade.
- **Auto-mark a grade** — one click grades every submitted answer for a whole grade (compares admin answer vs student answer, full marks on every match).
- **Admin annotations** — admins annotate student working directly on the marking screen (annotation canvas).
- **Test contests** — admins create, start and stop a practice/test contest instantly; students register and sit it just like a real contest, with per-grade papers and questions.
- **Tuition page** — public `/tuition` page streaming YouTube lessons added by the admin (link + name + description).
- **20 dashboard themes** — students pick their accent colour, stored per user and applied instantly to every dashboard page.
- **Floating calculator** — an in-tab calculator widget shown across the app; it never opens a new tab or steals focus, so it never trips the exam anti-cheat.
- **Certificates** — template designer (title, subtitle, colours, draggable elements), publish, PDF generation with optional email, plus manual certificate upload.
- **Support assistant (chatbot)** — keyword knowledge base plus safe arithmetic answers; admins can list/add/remove knowledge-base entries. Never reveals confidential data (passwords, M-PESA codes, other users' info).
- **Support messages** — threaded conversations from students/schools/admins, admin replies with unread tracking.
- **Admin dashboard** — contests, per-grade exam times/days, test contests, questions, materials, payments, parents, marking (auto + manual), results, certificates, admins, support manager.
- **Admin roles & permissions** — primary admin plus admins scoped by permission (`manage_schools`, `manage_questions`, `manage_results`, `manage_contests`, `reply_support`) and promoted student admins; permissions editable per admin.
- **Result export** — admin CSV export of contest participants and results.
- **Parent portal** — link or register children, pay a child's entry fee via M-PESA STK or manual proof, and view results/certificates.
- **School dashboard** — approved schools add students and view a school overview.
- **Account management** — forgot-password email reset (6-digit code, 15-minute expiry), change password and change email from Settings.
- **Leaderboard** — ranked by national, school or class filters.

---

## Design system

The frontend uses a **Blue Academic** design language — solid, WCAG-contrast-checked colours, no gradients, no emojis, no glassmorphism.

| Token | Colour | Use |
|-------|--------|-----|
| Royal Blue `primary` | `#1E3A8A` | primary buttons, links, headings |
| Academic Blue `secondary` / `brandblue` | `#2563EB` | secondary actions, accent text |
| Sky Blue `accent` | `#60A5FA` | accents, focus states |
| Light Surface `primary-light` / `cool-sky-800` | `#DBEAFE` | selected states, tinted tiles |
| Page Background `background` | `#F8FBFF` | page canvas |
| Surface `surface` | `#F1F5F9` | content wells |
| Foreground / Muted | `#0F172A` / `#475569` | primary and secondary text |

- Font: **Inter** (fallbacks Manrope, Source Sans 3); body 16px, small 14px.
- Corners rounded 12–16px; soft, low-opacity shadows; visible focus rings.
- Charts use the blue scale only (`#1E3A8A`, `#2563EB`, `#3B82F6`, `#60A5FA`, `#93C5FD`).
- All colours are defined once as semantic tokens in `frontend/src/index.css` (`--color-primary`, `--color-cool-sky-*`, …) and consumed by utility classes, so a restyle is a single-file change.
- **Per-user dashboard themes** — `frontend/src/theme.ts` injects a scoped stylesheet that redefines the accent variables under `.kmq-dashboard` (the root element of every dashboard page). The chosen colour recolours the dashboard while the public marketing site stays blue. The selection is saved per user (server-side `students.theme_color`) and cached in `localStorage` for instant application.

---

## Project structure

```
kenya-math-q/
├── backend/
│   ├── index.js              # Express app entry, route mounting
│   ├── runMigrations.js      # DB schema + versioned migrations runner
│   ├── createOwner.js        # bootstrap the first primary admin (owner) account
│   ├── migrations/           # versioned SQL migrations (001..009)
│   ├── config/db.js          # MySQL pool (DATABASE_URL or DB_* env)
│   ├── controllers/          # route handlers (auth, exam, marking, owner, ...)
│   ├── middleware/           # JWT auth, owner auth + requirePermission
│   ├── routes/               # Express routers
│   ├── utils/                # emailService, daraja (M-Pesa), fileGuard, etc.
│   └── uploads/              # materials, certificate PDFs (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # routes + global chatbot/calculator widgets
│   │   ├── pages/            # route components (+ owner-dashboard/)
│   │   ├── components/       # shared components (ui/, canvas, working, widgets)
│   │   ├── store/            # Zustand contest store
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
node createOwner.js --email=admin@example.com   # first primary admin (or set OWNER_EMAIL/OWNER_PASSWORD in .env; a password is generated if not given)
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

- **Registration & payment** — students register and pay via M-PESA STK (auto-confirms) or manual proof (shows as *M-PESA Unconfirmed — awaiting admin approval* until an admin approves). Parents can pay for a linked child the same way.
- **Exam** — a student starts the paper, sees compulsory per-grade instructions (which never count against the timer), then one randomised question at a time. Answers auto-save as a draft that can be resumed. On timeout (auto-submit), 3+ tab switches, or manual submit the exam is finalised — auto-graded in auto mode or queued for admin marking in manual mode.
- **Marking** — in *auto* mode an admin picks a contest → grade → **Marks**, and the backend compares each student's final answer to the correct answer, awarding full marks on every match. In *manual* mode the admin grades each question, annotating the student's working on canvas, with percentage/grade output. Results are released (or hidden) per contest.
- **Test contests** — an admin creates a test, adds per-grade papers/questions, then starts it (students see it as *Test* on the Contests page and can take it instantly) and stops it at any time.
- **Support** — students/schools send messages from the Support page; admins reply per conversation in the support manager with unread tracking. The chatbot answers from a keyword knowledge base and simple arithmetic, guarded against revealing confidential data.
- **Tuition** — admins add revisions as *YouTube video*, which are streamed on the public `/tuition` page.
- **Dashboard theme** — 20 swatches on the dashboard; the chosen colour recolours the whole dashboard and persists per user.
- **Account recovery** — a 6-digit reset code emailed to the student; change password or email anytime from Settings.

---

## License

Proprietary — © Kenya Math Quest.