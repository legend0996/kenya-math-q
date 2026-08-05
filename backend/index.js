import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import contestRoutes from "./routes/contestRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import schoolRoutes from "./routes/schoolRoutes.js";
import ownerRoutes from "./routes/owner.routes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import { finalizeExpiredDrafts } from "./controllers/examController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// CORS with credentials (required for httpOnly cookies cross-origin)
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "https://kenyamathquest.co.ke")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Request logging (no body, no auth header)
app.use((req, _res, next) => {
  if (req.path.startsWith("/api/health")) return next();
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Serve uploaded assets (certificate images, PDFs)
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  fallthrough: false,
  setHeaders: (res, filePath) => {
    if (/\.pdf$/i.test(filePath)) res.setHeader("Content-Disposition", "inline");
  },
}));

app.use("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), ts: new Date().toISOString() });
});

app.use("/api/contest", contestRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/certificate", certificateRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/parent", parentRoutes);

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// Central error handler
app.use((err, req, res, _next) => {
  console.error("❌ ERROR:", err);
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Email configuration status (SMTP). Emails (certificate/reset) only send when
// SMTP_HOST, EMAIL_USER and EMAIL_PASS are set. Certificates are ALSO shown in
// the student dashboard, so email is optional, not required.
const _emailConfigured =
  Boolean(process.env.SMTP_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
console.log(
  `${_emailConfigured ? "✅" : "⚠️"} SMTP email ${_emailConfigured ? "configured" : "NOT configured"} (set SMTP_HOST, EMAIL_USER & EMAIL_PASS to enable sending).`,
);

// ⏲️ Auto-submit expired exam sessions (idempotent: UNIQUE result key guards races)
setInterval(() => {
  finalizeExpiredDrafts().then((n) => {
    if (n > 0) console.log(`auto-submit: finalized ${n} expired session(s)`);
  }).catch((e) => console.error("auto-submit sweep failed:", e.message));
}, 30_000).unref();
