# Kenya Math Quest — User Manual

Welcome to Kenya Math Quest. This manual explains every feature available to each type of user — **Owner (Admin)**, **School**, **Parent**, and **Student** — together with the common errors each user may see and how to fix them.

---

## Contents

1. [Getting Started](#1-getting-started)
2. [Student Guide](#2-student-guide)
3. [Parent Guide](#3-parent-guide)
4. [School Guide](#4-school-guide)
5. [Owner / Admin Guide](#5-owner--admin-guide)
6. [Common Errors for All Users](#6-common-errors-for-all-users)
7. [Forgot Password / Reset](#7-forgot-password--reset)

---

## 1. Getting Started

| What | Where |
|---|---|
| Public website | `https://kenyamathsquest.co.ke` |
| API | `https://api.kenyamathsquest.co.ke` |
| Student / School / Parent login | `/login` |
| Admin login (restricted) | `/owner-login-7843-secure` |

All accounts are password-protected. Your session lasts **7 days**. When you log in you will be taken straight to your own dashboard:

| Role | Lands on |
|---|---|
| Student | `/dashboard` |
| School | `/school-dashboard` |
| Parent | `/parent-dashboard` |
| Admin/Owner | `/admin-dashboard` |

**If you are bumped back to the login page after signing in**, your browser has no valid session. Log in again. This also happens if your session expired after 7 days, or if you are using a browser where cookies are blocked.

---

## 2. Student Guide

### 2.1 Create an account

1. Open the site and click **Register**.
2. Choose the **Student** tab.
3. Fill in:
   - **Full Name** (will be shown in capitals)
   - **School Name**
   - **Grade / Form** (Grade 7, 8, 9 — Form 1 to 4)
   - **Email address**
   - **Password** (at least 8 characters)
4. Click **Register**.

Your account is **immediately active** — no admin approval is needed for students.

**Errors you may see and how to fix them:**

| Error message | Why it happened | How to fix |
|---|---|---|
| "All fields are required" | One or more fields empty | Fill every box |
| "Enter a valid email address" | Email is misspelt | Type the email correctly |
| "Password must be at least 8 characters" | Password too short | Use 8 or more characters |
| "Email or username already registered" | An account already uses that email | Log in instead, or use a different email |
| "Registration failed. Please check your details." | Something was wrong on the server | Try again in a minute |
| "Connection error. Please check your network." | No internet, or the site is down | Check internet and reload |

### 2.2 Log in

Login is **two steps**:

1. Enter your **email address or username** and click **Next**.
   - Not found → *"No account found with that email/username. Try a different one or register."*
2. Type your **password** and click **Log in**.
   - Wrong password → *"Invalid credentials"*.
   - After 10 failed attempts you will see *"Too many login attempts. Try again later."* — wait 15 minutes.

You will be taken to `/dashboard`.

### 2.3 Your dashboard

The dashboard shows:

- Your **name, grade, and school**
- **Stats** (contests entered, certificates, etc.)
- The **current contest** with its status:
  - *Live* / *Upcoming* / *Ended* / *Reopened for you*
- The **exam card** for the current contest
- **Payment status** for the contest
- **My certificates**
- **Past contests**
- **Study materials** for your grade (downloads, links, videos, text)
- A **theme colour picker** (stored on your device)

### 2.4 Contests and payment

Open **Contests** to see the list:

- **Real contests** — you must **register**, and usually **pay** (M-Pesa) before you can take the exam.
- **Test contests** — no payment, opened by admins for practice; you go straight into the exam.

**Register:** click **Register for Contest**.

**Pay:** there are two ways:

1. **M-PESA STK (instant):** enter your Safaricom phone number, approve the payment on your phone. When Safaricom confirms, you are marked **Paid** automatically.
2. **Manual / payment code:** pay into the contest account, then submit the M-PESA transaction code. An admin reviews and approves it.

**Errors you can see and how to fix them:**

| Error | Why | Fix |
|---|---|---|
| "Registration is currently closed" | Admin closed registration | Wait until admin opens registration |
| "You are already registered for this contest" | You already registered | Go to the exam page |
| "M-PESA STK is not available. Submit a payment code instead." | Automatic M-PESA not active | Use the manual payment code option |
| "Enter a valid Safaricom phone number" | Phone not in `07XX…` / `+254` format | Type a Kenyan Safaricom number |
| "M-PESA Unconfirmed" / "STK Confirming…" | Payment is still processing | Wait — it auto-confirms via callback |
| "This M-PESA code has already been used" | That transaction code was used before | Use a different code |
| "Payment proof already submitted, awaiting approval" | You already sent a code | Wait for the admin to review it |

### 2.5 Taking the exam

1. Open the contest and click **Start Exam** (or continue your saved attempt).
2. Read the **instructions** for your grade and click **I accept / Begin**.
3. Your timer starts. The allowed time is set by the admins (default **10 minutes**).
4. Answer the questions:
   - **Multiple-choice (A–D):** tap the option you want.
   - **Open questions:** type in the text box.
   - Use the **on-screen calculator** and **scratchpad / working canvas** if available.
5. **Move to the next question** only after answering — otherwise you get *"Answer this question to move on."*
6. On the last question click **Submit**.
7. Timer reaches 00:00 → your answers are **submitted automatically**.

**Integrity / proctoring:** leaving the page, switching tabs, or pressing keys like F12/print-screen counts as a **violation**. After 3 violations your exam is auto-submitted with the banner *"Integrity warning: leaving the exam is not allowed."* Don’t leave the exam tab.

**Important:** Your answers are **saved automatically** while you type — you can close the tab and resume.

**After submitting:**

- **Auto-marked contest:** your grade and score appear at once (`Distinction`, `Merit`, `Pass`, `Credit`).
- **Manually-marked contest:** *"Answers submitted — your paper will be marked manually."* Wait for the admin.

**Errors:**

| Error | Meaning | Fix |
|---|---|---|
| "Register for the contest first" | Not registered | Register and pay, then start |
| "Payment required before starting the exam" | Not paid | Pay, or wait for admin approval of payment |
| "The contest has not started yet" | Too early | Wait until start time shown |
| "The contest has ended" | Too late | This window is over (if admin reopened it for you, that shows instead) |
| "You already submitted this exam" | Double submit | Nothing to do — you are done |
| "Time is up — your saved answers were submitted automatically." | Timer hit 0 | That’s fine, they were stored |
| "You didn't answer any questions, so this attempt was not recorded." | Opened but answered nothing | Start again while the window is open |

### 2.6 Results

- On your dashboard under the contest card: **"Completed — Score: XX pts"** once graded.
- Results from the admin may be shown on the **Leaderboard** (best top-3 podium + your rank).
- The admin must **release** results before you can view your **paper review**. Until then: *"Results not released yet"*.
- You can review your own answers + the correct answers once the admin releases the paper.

### 2.7 Certificates

- When a contest finishes, admins may **issue certificates**.
- Under **My Certificates** you will see any certificates you earned, with a **Download** button.
- The download needs no password from you (it's token-gated).

### 2.8 Study materials & Tuition

- View **Materials** page or the Materials card on your dashboard for files, links and text for your grade.
- The **Tuition** page lists **video lessons**; click one to watch it or "see it on the Tuition page".
- *"Could not load materials"* usually means a connection problem — retry.

### 2.9 Support / Chatbot

- **Support** page: message the admins. Replies appear as a conversation (refreshes every 8 s). Don't send empty messages.
- **Chatbot** (bottom-right): type a question like *"how to register"* or *"what is 12 × 8?"*.
  - If the bot can't help: *"I wasn't quite sure about that..."* — try different wording or use Support.

### 2.10 Settings

- **Change class/grade**: update your grade.
- **Change email**: type your current password + new email. Errors: “Invalid email”, “Current password is incorrect”, “Email already in use”.
- **Change password**: current + new (≥ 8 chars).

---

## 3. Parent Guide

### 3.1 Create a parent account

1. **Register** → choose the **Parent** tab.
2. Fields: **Full Name**, **Phone Number** (use the number joined to the child’s records), **Email**, **Password**.
3. Register. You can then log in at `/login` with the **Parent** tab.

Error messages are the same as the student’s (see “All fields are required”, etc.).

### 3.2 Link your child (consent flow)

Linking is **two-step** by design:

1. **Link a child** — enter the child’s **email or username**, click Connect.
2. The system emails a **6‑digit code** to the child’s account. (It expires in 30 minutes.)
3. The child tells you the code, you type it in and **confirm the link**.

Only after step 3 is the child **linked** and visible to you. Until then the parent never sees the child’s data.

**Errors**:

| Error | Meaning | Fix |
|---|---|---|
| "Student email is required" | Empty box | Fill it in |
| "No student account could be linked. Ask your child to verify their username/email." | No student matched that email | Double-check / ask the child |
| "This child is already linked to your account" | Already linked | Just use the dashboard |
| "A linking request is already pending confirmation" | A link is already waiting | Finish that confirmation |
| "Linking requires a working email service. Contact support." | Email not configured | Contact the admin |
| "Could not send the confirmation code. Please try again." | Email failed | Retry in a minute |
| "The confirmation code is 6 digits" | Code wrong length | Enter all 6 digits |
| "This confirmation code has expired. Restart." | 30 minutes passed | Start linking again |
| "Incorrect confirmation code" | Code mismatch | Ask the child again |

> **Note:** You can also **Register a child from your Parent dashboard** (creates a new student account). With this method the child is **linked immediately** (no code required).

### 3.3 Parent dashboard

- Statistics: **Linked children**, **Contests entered**, **Certificates**.
- Current contest card and each child’s status:
  - `Not registered for current contest`
  - `Registered • Paid` (green)
  - `Payment under review`
  - `Registered • Payment required`
  - Score + result if complete
- **View Full Details** on any child → their account info, contest status, **contest history**, and **certificates** (downloadable).
- **Unlink** child → removes the parent–child connection.

### 3.4 Paying for a child

If a child hasn't paid:

- **M‑PESA STK**: one-tap push to **your profile phone**; approve on your phone.
  - *"M-Pesa STK is not available"* → use the manual code instead.
  - *"Enter a valid M-Pesa phone number"* → check your profile number.
- **Manual payment code**: enter the M‑PESA transaction code for the contest account; an admin verifies it.

### 3.5 Child detail & certificate download

- Open **child details** and click **Download** on any certificate.
- Access errors:
  - "Certificate not found" / "Invalid certificate" → certificate issue
  - "Certificate is not linked to your account" → you don't own that child

---

## 4. School Guide

### 4.1 Register / approval

1. **Register** → choose the **School** tab.
2. Fields: **School Name**, **County**, **Email**, **Password**.
3. Your school is created as **"pending"** — an admin must **approve** it before you can log in.

- Login before approval → *"School not approved yet"*.
- Duplicate school email → *"School email or username already registered."*

### 4.2 School dashboard

- **Statistics**: Total students, Registered, Paid.
- **Current contest** banner.
- **Add Student** — add students to your school list (name + grade).
- **Students** list — status badges:
  - `Registered` / `Not registered`
  - `Paid` / `Payment pending`
  - `N pts · Grade` (if results in)
  - `Timed out`
- **School Results** — ranked list of your students with scores (top 3 highlighted).

**Errors:**

| Error | Meaning | Fix |
|---|---|---|
| "School not approved yet" | Admin hasn’t approved you | Wait or contact the admin |
| "Failed to add student" | Missing name/grade, or server issue | Check the fields and retry |
| "Connection error" | Network | Reload |

---

## 5. Owner / Admin Guide

### 5.1 Logging in

- Go to `/admin-login-secured` (or the owner login link).
- Use the admin email + password (created by the primary admin).

| Error | Fix |
|---|---|
| "Invalid credentials" | Wrong email/password — check and retry |
| "Connection error. Please try again." | Network — reload |

### 5.2 Tabs and permissions

Admins own the **Admin Panel**. What you see depends on your **permissions** (`manage_results`, `manage_schools`, `manage_contests`, `manage_questions`, `manage_admin`, and others) — the **primary admin** (the first account) sees everything.

| Tab | What you can do | Required permission |
|---|---|---|
| **Overview** | Stats: students, schools, registered, paid, pending payments | always |
| **Schools** | Approve / reject pending school accounts | `manage_schools` |
| **Contests** | Create/name contests, set entry fee, activate, open/close registration, set pergrade exam times, per-grade days | `manage_contests` |
| **Questions** | Add MCQ / open questions, correct answers | `manage_questions` |
| **Instructions** | Grade-specific instructions (students see before the exam) | `manage_questions` |
| **Materials** | study materials for any grade | `manage_questions` |
| **Payments** | See pending M-PESA proofs (manual) — approve/reject; registrations list | `manage_contests` |
| **Parents** | View linked parents/children | `manage_contests` |
| **Results** | View results, release/withhold results for the students | `manage_results` |
| **Marking** | Mark open answers / set marking mode (auto/manual) | `manage_results` |
| **Certificates** | Upload template, generate/publish certificates, delete | `manage_results` |
| **Test Contests** | Create instant Test contests (free, so students can practise) | `manage_questions` |
| **Admins** | Add / remove sub‑admins, set permissions (primary only) | `manage_admin` |
| **Support** | Respond to student support threads | `reply_support` |
| **Assistant** | Edit the AI assistant’s answers | `reply_support` |

### 5.3 The tabs in detail

**Overview**
- Shows: Students, Schools, Registered, Paid count.
- A warning banner if there are pending M‑PESA payments.
- Quick cards to jump to Schools / Contests / Questions / Certificates.

**Schools**
- List of schools with **pending** status. Approve or **Reject**.

**Contests**
- **Create New Contest:** name, date+time (2-hour window default), entry fee (KES).
- Each contest row shows status: Live / Upcoming / Ended / Reg Open / Closed, entry fee.
- **Activate** — marks to open where appropriate.
- **Open/Close Reg** — toggles registration.
- **Grade Times** — exam duration per grade (default 10 min).
- **Grade Days** — give each grade its own contest day (unchecked = global window).
- **Set Fee** — update the entry fee.

**Questions**
- Create and edit the question bank (assign by grade), set answers.

**Instructions**
- Add/up/per-grade instruction text students must accept before the exam starts.

**Materials**
- Publish **Unofficial Study materials** for any grade; types: file, link, text, video.

**Payments**
- Pending M‑PESA proofs — Approve/Reject.
- **Registrations** list below.

**Parents**
- Browse parent accounts (email, phone, children).

**Results**
- View results per contest; **Release/withhold** results for students to see.

**Certificates**
- Design the certificate (image), publish the template, **generate** certificates for a contest, and issue/delete.

**Marking**
- For manual contests, **mark** answers; toggle marking mode; a paper shows P-release per student (answered / pending).

**Test Contests**
- Make a **free “test” contest** anytime — students can practise instantly.

**Admins**
- (Primary admin) **Add an admin** (email + password), restrict or set **permissions** (e.g. only `manage_results`), and remove a sub-admin. A second admin cannot change the primary admin.

**Support**
- Support thread has timestamps and quick actions: **Mark an open**, and full conversation.

### 5.4 Common admin errors

| Error | Meaning | Fix |
|---|---|---|
| "Only the primary admin can add/remove admins" | Permission `manage_admin` / is_primary required | Upgrade into primary admin or grant the permission |
| "You do not have permission to do this" | Tab requires a permission you don't have | Ask primary admin to add the permission |
| "User already exists" | Duplicate | Edit, not re-add |
| "Contest already ended" (on create) | Backdate too far | Pick a future start date |
| API errors (500) | DB or config issue on server | Check server logs, restart the backend |
| "CORS blocked" (in console) | Domain not allowed to call the API | Add the domain to `FRONTEND_ORIGINS` on the server and restart |

---

## 6. Common Errors for All Users

| You see | Where | Fix |
|---|---|---|
| "No token provided" (401) | any screen | Your session expired — log in again. |
| "Invalid or expired token" (403) | any screen | Same: re-log. |
| "Too many login attempts" | login | Wait ~15 min. |
| "Too many reset attempts" | forgot password | Wait ~15 min. |
| "Connection error. Please check your network." | anywhere | Check internet, reload, retry in a moment. |
| "Server does not support secure connection" | admin logs only | SMTP / DB SSL setting **`DB_SSL=false`** on same host**. |
| Network request fails with 500 | any request | Backend hiccup — try again in a minute, or contact support. |

---

## 7. Forgot Password / Reset

Both students and schools (not admins** — owners reset through the owner; admins get support) can reset through the public page.

1. Go to **forgot password**.
2. Enter your email. The site will always say *"If that account exists, a reset code was sent"* (don’t reveal existingers). It lasts ~15 minutes.
3. Open the email, use the **6-digit code**, set a **new password** (at least 8 characters).
4. Log in with your new password.

**Reset errors:**

| Error | Meaning | Fix |
|---|---|---|
| "Invalid or expired code" | Typo/old code | Re-enter / request a new one |
| "This code has expired. Request a new one." | >15 min passed | Request again |
| "Too many attempts. Request a new code." | 5 wrong guesses | start over |
| "New password must be at least 8 characters" | Weak new password | Use 8+ characters |
| "Passwords do not match" | New password copied wrong | Repeat the match |
| "No email service" | SMTP not configured | Contact the admins to set `SMTP_*` and a real `EMAIL_PASS` on the server |

> ⚠️ If you type your email and never receive a code, check the spam folder, then ask your administrator to confirm the SMTP settings and mailbox.

---

*End of manual.*