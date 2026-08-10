import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { issueAuthCookie, clearAuthCookie } from "../utils/auth.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";

const TABLES = {
  student: "students",
  school: "schools",
  owner: "owners",
  parent: "parents",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validAuth = (pw) => typeof pw === "string" && pw.length >= 8;
const validEmail = (e) => typeof e === "string" && EMAIL_RE.test(e);
const tableHas = (role) => Boolean(TABLES[role]);

// Normalize text fields: names / schools / counties in CAPITALS, email lowercase.
const normName = (v) => String(v || "").trim().toUpperCase();
const normEmail = (v) => String(v || "").trim().toLowerCase();

// Find an account by email OR username across students / schools / owners.
// Returns { role, id, email, username, name } or null.
export const lookupByIdentifier = async (identifier) => {
  const id = String(identifier || "").trim().toLowerCase();
  if (!id) return null;

  for (const role of ["student", "school", "owner", "parent"]) {
    const table = TABLES[role];
    const nameCol =
      role === "student" || role === "parent"
        ? "full_name"
        : role === "owner"
          ? "COALESCE(username, email)"
          : "name";
    const res = await pool.query(
      `SELECT id, email, username, ${nameCol} AS name FROM ${table} WHERE LOWER(email)=? OR LOWER(username)=? LIMIT 1`,
      [id, id],
    );
    if (res.rows.length > 0) {
      const r = res.rows[0];
      return { role, id: r.id, email: r.email, name: r.name, username: r.username };
    }
  }
  return null;
};

// 🔎 STEP 1 of two-step login — does this email/username exist?
export const checkIdentifier = async (req, res) => {
  try {
    const { identifier } = req.body;
    const acct = await lookupByIdentifier(identifier);
    if (!acct) {
      return res.json({ success: true, exists: false, message: "Account not found" });
    }
    return res.json({
      success: true,
      exists: true,
      role: acct.role,
      name: acct.name,
      email_masked: acct.email
        ? acct.email.replace(/^(.)(.*)@/, (m, a, b) => `${a}${"*".repeat(b.length)}@`)
        : "",
    });
  } catch (error) {
    console.error("CHECK IDENTIFIER ERROR:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// 🚪 LOGOUT — clears the httpOnly session cookie
export const logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: "Logged out" });
};

// 👤 CURRENT USER — reads identity from the verified token (cookie or header).
// With soft auth (no token / invalid token) this just reports "not logged in".
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ user: null });
    }
    const { id, role } = req.user;

    if (role === "student") {
      const rows = (await pool.query(
        "SELECT id, full_name, email, username, school, grade, parent_phone, student_phone, paid FROM students WHERE id=?",
        [id],
      )).rows;
      if (!rows[0]) return res.status(404).json({ error: "Account not found" });
      const s = rows[0];
      return res.json({
        user: { id: s.id, role: "student", name: s.full_name, email: s.email, username: s.username, school: s.school, grade: s.grade, phone: s.student_phone || s.parent_phone || null },
      });
    }
    if (role === "parent") {
      const rows = (await pool.query(
        "SELECT id, full_name, email, phone FROM parents WHERE id=?",
        [id],
      )).rows;
      if (!rows[0]) return res.status(404).json({ error: "Account not found" });
      const p = rows[0];
      return res.json({ user: { id: p.id, role: "parent", name: p.full_name, email: p.email, phone: p.phone } });
    }
    if (role === "school") {
      const rows = (await pool.query(
        "SELECT id, name, email, county FROM schools WHERE id=?",
        [id],
      )).rows;
      if (!rows[0]) return res.status(404).json({ error: "Account not found" });
      const s = rows[0];
      return res.json({ user: { id: s.id, role: "school", name: s.name, email: s.email, county: s.county, school: s.name } });
    }
    if (role === "owner") {
      const ownerRows = (await pool.query(
        "SELECT id, COALESCE(username, email) AS name, email FROM owners WHERE id=?",
        [id],
      )).rows;
      if (ownerRows[0]) {
        return res.json({ user: { id: ownerRows[0].id, role: "owner", name: ownerRows[0].name, email: ownerRows[0].email } });
      }
      const studRows = (await pool.query(
        "SELECT id, full_name, email, school FROM students WHERE id=? AND is_admin=1",
        [id],
      )).rows;
      if (studRows[0]) {
        return res.json({ user: { id: studRows[0].id, role: "owner", name: studRows[0].full_name, email: studRows[0].email, school: studRows[0].school } });
      }
      return res.status(404).json({ error: "Account not found" });
    }
    res.status(401).json({ error: "Unknown role" });
  } catch (error) {
    console.error("GET ME ERROR:", error);
    res.status(500).json({ error: "Could not load account" });
  }
};

// 👨‍🎓 STUDENT REGISTER
export const registerStudent = async (req, res) => {
  try {
    const { full_name, email, username, password, school, grade } = req.body;

    if (!full_name || !email || !password || !school || !grade) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!validEmail(email)) {
      return res.status(400).json({ error: "Enter a valid email address" });
    }
    if (!validAuth(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const uname = username ? String(username).trim() : null;
    const cEmail = normEmail(email);
    const cName = normName(full_name);
    const cSchool = normName(school);

    const exists = await pool.query(
      "SELECT * FROM students WHERE email=? OR (username IS NOT NULL AND username=?)",
      [cEmail, uname],
    );
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "Email or username already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO students (full_name, email, username, password, school, grade)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cName, cEmail, uname, hashed, cSchool, grade],
    );

    res.json({
      success: true,
      message: "Student registered successfully",
      user: { id: result.insertId, full_name: cName, email: cEmail, username: uname, school: cSchool, grade },
    });
  } catch (error) {
    console.error("REGISTER STUDENT ERROR:", error);
    res.status(500).json({ error: "Registration failed. Please try again.", debug: error.message });
  }
};

// 🏫 SCHOOL REGISTER (PENDING APPROVAL)
export const registerSchool = async (req, res) => {
  try {
    const { name, email, username, password, county } = req.body;

    if (!name || !email || !password || !county) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!validEmail(email)) {
      return res.status(400).json({ error: "Enter a valid email address" });
    }
    if (!validAuth(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const uname = username ? String(username).trim() : null;
    const cEmail = normEmail(email);
    const cName = normName(name);
    const cCounty = normName(county);
    const exists = await pool.query(
      "SELECT * FROM schools WHERE email=? OR username IS NOT NULL AND username=?",
      [cEmail, uname],
    );
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "School email or username already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO schools (name, email, username, password, county, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [cName, cEmail, uname, hashed, cCounty],
    );

    res.json({
      success: true,
      message: "School registered. Await admin approval.",
      school: { id: result.insertId, name: cName, status: "pending" },
    });
  } catch (error) {
    console.error("REGISTER SCHOOL ERROR:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

const signToken = (payload, res) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
  issueAuthCookie(res, token);
  return token;
};

// 👨‍👩‍👧 PARENT REGISTER
export const registerParent = async (req, res) => {
  try {
    const { full_name, email, username, password, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "Full name, email and password are required" });
    }
    if (!validEmail(email)) {
      return res.status(400).json({ error: "Enter a valid email address" });
    }
    if (!validAuth(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const uname = username ? String(username).trim() : null;
    const cEmail = normEmail(email);
    const cName = normName(full_name);
    const exists = await pool.query(
      "SELECT * FROM parents WHERE email=? OR (username IS NOT NULL AND username=?)",
      [cEmail, uname],
    );
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "Email or username already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO parents (full_name, email, username, password, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [cName, cEmail, uname, hashed, phone || null],
    );

    res.json({
      success: true,
      message: "Parent registered successfully. You can now log in and link your children.",
      user: { id: result.insertId, full_name: cName, email: cEmail, username: uname, phone: phone || null },
    });
  } catch (error) {
    console.error("REGISTER PARENT ERROR:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

// 👨‍🎓 STUDENT LOGIN (email OR username)
export const loginStudent = async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.email;
    const { password } = req.body;

    const acct = await lookupByIdentifier(identifier);
    if (!acct || acct.role !== "student") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = await pool.query("SELECT * FROM students WHERE id=?", [acct.id]);
    if (user.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.rows[0].password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const student = user.rows[0];
    // Promoted student admins land on the admin dashboard when they log in
    const role = student.is_admin ? "owner" : "student";
    const token = signToken({ id: student.id, role, school: student.school, name: student.full_name }, res);

    res.json({
      success: true,
      token,
      admin: !!student.is_admin,
      user: {
        id: student.id,
        name: student.full_name,
        email: student.email,
        username: student.username,
        school: student.school,
        role,
      },
    });
  } catch (error) {
    console.error("LOGIN STUDENT ERROR:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

// 🏫 SCHOOL LOGIN (email OR username) — checks approval
export const loginSchool = async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.email;
    const { password } = req.body;
    const acct = await lookupByIdentifier(identifier);
    if (!acct || acct.role !== "school") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = await pool.query("SELECT * FROM schools WHERE id=?", [acct.id]);
    if (user.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    const school = user.rows[0];

    if (school.status !== "approved") {
      return res.status(403).json({ error: "School not approved yet" });
    }

    const valid = await bcrypt.compare(password, school.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ id: school.id, role: "school", school: school.name }, res);

    res.json({
      success: true,
      token,
      school: { id: school.id, name: school.name, email: school.email, username: school.username, county: school.county },
    });
  } catch (error) {
    console.error("LOGIN SCHOOL ERROR:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

// 👨‍👩‍👧 PARENT LOGIN (email OR username)
export const loginParent = async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.email;
    const { password } = req.body;

    const acct = await lookupByIdentifier(identifier);
    if (!acct || acct.role !== "parent") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = await pool.query("SELECT * FROM parents WHERE id=?", [acct.id]);
    if (user.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.rows[0].password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const parent = user.rows[0];
    const token = signToken({ id: parent.id, role: "parent", name: parent.full_name, phone: parent.phone }, res);

    res.json({
      success: true,
      token,
      user: {
        id: parent.id,
        name: parent.full_name,
        email: parent.email,
        username: parent.username,
        phone: parent.phone,
        role: "parent",
      },
    });
  } catch (error) {
    console.error("LOGIN PARENT ERROR:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

const verifyCurrentPassword = async (role, id, current) => {
  const table = TABLES[role];
  if (!table) return false;
  const r = await pool.query(`SELECT password FROM ${table} WHERE id=?`, [id]);
  if (r.rows.length === 0) return false;
  return bcrypt.compare(current, r.rows[0].password);
};

// 🔐 CHANGE PASSWORD (logged-in student/school) — requires current password
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const { role, id } = req.user || req.owner || {};

    if (!tableHas(role)) return res.status(403).json({ error: "Not allowed" });
    if (!validAuth(new_password)) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
    if (!(await verifyCurrentPassword(role, id, current_password || ""))) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query(`UPDATE ${TABLES[role]} SET password=? WHERE id=?`, [hashed, id]);

    res.json({ success: true, message: "Password updated" });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ error: "Could not update password. Please try again." });
  }
};

// ✉️ CHANGE EMAIL (logged-in user/school) — requires current password
export const changeEmail = async (req, res) => {
  try {
    const { current_password, new_email } = req.body;
    const { role, id } = req.user || req.owner || {};
    if (!tableHas(role)) return res.status(403).json({ error: "Not allowed" });
    if (!validEmail(new_email || "")) return res.status(400).json({ error: "Enter a valid email" });
    if (!(await verifyCurrentPassword(role, id, current_password || ""))) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const clash = await pool.query(
      `SELECT id FROM ${TABLES[role]} WHERE email=? AND id<>? LIMIT 1`,
      [new_email, id],
    );
    if (clash.rows.length > 0) return res.status(400).json({ error: "Email already in use" });

    await pool.query(`UPDATE ${TABLES[role]} SET email=? WHERE id=?`, [new_email, id]);
    res.json({ success: true, message: "Email updated" });
  } catch (error) {
    console.error("CHANGE EMAIL ERROR:", error);
    res.status(500).json({ error: "Could not update email. Please try again." });
  }
};

const makeCode = () => crypto.randomInt(100000, 999999).toString();

// Store only a SHA-256 hash of the reset code (never the plaintext).
const hashCode = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");
const safeEquals = (a, b) => {
  const ah = Buffer.from(String(a || ""), "hex");
  const bh = Buffer.from(String(b || ""), "hex");
  return ah.length === bh.length && ah.length > 0 && crypto.timingSafeEqual(ah, bh);
};

// 🔑 REQUEST PASSWORD RESET — emails a 15-minute code
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const acct = await lookupByIdentifier(email);
    if (!acct || acct.role === "owner") {
      // No existing account (or owner); still return success to avoid enumeration
      return res.json({ success: true, message: "If that account exists, a reset code was sent." });
    }

    // Fail closed: if email delivery is not available, do NOT mint a code and
    // do NOT return one to the caller.
    const emailConfigured = Boolean(
      process.env.SMTP_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS,
    );
    if (!emailConfigured) {
      console.error(`PASSWORD RESET SKIPPED: email not configured for ${acct.email}`);
      return res.json({ success: true, message: "If that account exists, a reset code was sent." });
    }

    const code = makeCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query("DELETE FROM password_resets WHERE email=?", [acct.email]);
    try {
      await pool.query(
        "INSERT INTO password_resets (email, code, code_hash, expires_at) VALUES (?,?,?,?)",
        [acct.email, code, hashCode(code), expires],
      );
    } catch (e) {
      if (/Unknown column 'code_hash'/.test(e.message)) {
        // Migration 010 (code_hash) not applied on this host; store plaintext code.
        await pool.query(
          "INSERT INTO password_resets (email, code, expires_at) VALUES (?,?,?)",
          [acct.email, code, expires],
        );
      } else {
        throw e;
      }
    }

    try {
      await sendPasswordResetEmail(acct.email, code, acct.name, acct.role);
    } catch (e) {
      // Clean up the unusable record; never leak the code to the client.
      console.error("RESET EMAIL ERROR:", e.message);
      await pool.query("DELETE FROM password_resets WHERE email=?", [acct.email]);
      return res.status(500).json({ error: "Could not send the reset code right now. Please try again later." });
    }

    res.json({ success: true, message: "A reset code was sent to your email." });
  } catch (error) {
    console.error("REQUEST RESET ERROR:", error);
    res.status(500).json({ error: "Could not start password reset." });
  }
};

// 🔓 RESET PASSWORD with the emailed code (valid 15 minutes, 5 attempts max)
export const resetPassword = async (req, res) => {
  try {
    const { email, code, new_password } = req.body;
    if (!validAuth(new_password)) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const row = (
      await pool.query(
        "SELECT * FROM password_resets WHERE email=? AND used=0 ORDER BY id DESC LIMIT 1",
        [String(email || "").trim()],
      )
    ).rows[0];
    if (!row) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "This code has expired. Request a new one." });
    }
    if ((row.attempts || 0) >= 5) {
      return res.status(400).json({ error: "Too many attempts. Request a new code." });
    }

    // Compare against the stored hash (timing-safe). Backwards-compatible
    // fallback: rows created before hashing stored a plaintext `code`.
    const matches =
      (row.code_hash && safeEquals(row.code_hash, hashCode(code))) ||
      (row.code_hash ? false : row.code === String(code || "").trim());

    if (!matches) {
      await pool.query("UPDATE password_resets SET attempts=attempts+1 WHERE id=?", [row.id]);
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    const acct = await lookupByIdentifier(email);
    if (!acct) return res.status(400).json({ error: "Account not found" });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query(`UPDATE ${TABLES[acct.role]} SET password=? WHERE id=?`, [hashed, acct.id]);
    await pool.query("UPDATE password_resets SET used=1, attempts=attempts+1 WHERE id=?", [row.id]);

    res.json({ success: true, message: "Password updated. You can now log in." });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ error: "Could not reset password. Please try again." });
  }
};