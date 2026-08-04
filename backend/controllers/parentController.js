import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";
import {
  darajaConfigured,
  paymentAmount,
  stkPush,
  normalizePhone,
} from "../utils/daraja.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "../uploads");

const requireParent = (req, res) => {
  if (req.user?.role !== "parent") {
    res.status(403).json({ error: "Parent access only" });
    return false;
  }
  return true;
};

// 👨‍👩‍👧 PARENT DASHBOARD — linked children with current contest status
export const getParentDashboard = async (req, res) => {
  try {
    if (!requireParent(req, res)) return;
    const parentId = req.user.id;

    const childrenRes = await pool.query(
      `SELECT s.id, s.full_name, s.email, s.school, s.grade, s.parent_phone
         FROM parent_links pl
         JOIN students s ON s.id = pl.student_id
        WHERE pl.parent_id=?
        ORDER BY s.id DESC`,
      [parentId],
    );
    const children = childrenRes.rows;

    const contestRes = await pool.query(
      "SELECT * FROM contests ORDER BY start_time DESC LIMIT 1",
    );
    const contest = contestRes.rows[0] || null;
    const contestId = contest?.id ?? 0;

    const dashboard = [];
    for (const child of children) {
      const [regRes, resultRes, certRes, pastRes] = await Promise.all([
        pool.query(
          "SELECT payment_status FROM registrations WHERE student_id=? AND contest_id=?",
          [child.id, contestId],
        ),
        pool.query(
          "SELECT score, percentage, grade, completed, marked FROM results WHERE student_id=? AND contest_id=?",
          [child.id, contestId],
        ),
        pool.query(
          "SELECT COUNT(*) AS n FROM certificates WHERE student_id=?",
          [child.id],
        ),
        pool.query(
          "SELECT COUNT(*) AS n FROM results WHERE student_id=? AND completed=1",
          [child.id],
        ),
      ]);

      dashboard.push({
        id: child.id,
        full_name: child.full_name,
        email: child.email,
        school: child.school,
        grade: child.grade,
        parent_phone: child.parent_phone,
        registered: regRes.rows.length > 0,
        payment_status: regRes.rows[0]?.payment_status || null,
        result: resultRes.rows[0] || null,
        certificates: certRes.rows[0]?.n || 0,
        contests_entered: pastRes.rows[0]?.n || 0,
      });
    }

    res.json({ success: true, contest, children: dashboard });
  } catch (error) {
    console.error("PARENT DASHBOARD ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔗 LINK CHILD — verifies the student's email, then links (no phone needed,
// so a parent can add every child using just their account email)
export const linkChild = async (req, res) => {
  try {
    if (!requireParent(req, res)) return;
    const parentId = req.user.id;
    const { student_email } = req.body;

    if (!student_email) {
      return res.status(400).json({ error: "Student email is required" });
    }

    const parent = (await pool.query("SELECT * FROM parents WHERE id=?", [parentId])).rows[0];
    if (!parent) return res.status(401).json({ error: "Parent not found" });

    const idValue = String(student_email).trim().toLowerCase();
    const stud = (
      await pool.query(
        "SELECT * FROM students WHERE LOWER(email)=? OR (username IS NOT NULL AND LOWER(username)=?) LIMIT 1",
        [idValue, idValue],
      )
    ).rows[0];
    if (!stud) {
      return res.status(404).json({ error: "No student found with that email" });
    }

    await pool.query(
      `INSERT INTO parent_links (parent_id, student_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE id=id`,
      [parentId, stud.id],
    );

    res.json({
      success: true,
      child: {
        id: stud.id,
        full_name: stud.full_name,
        email: stud.email,
        grade: stud.grade,
        school: stud.school,
      },
    });
  } catch (error) {
    console.error("LINK CHILD ERROR:", error);
    res.status(500).json({ error: "Could not link child. Please try again." });
  }
};

// 👶 REGISTER A NEW CHILD (parent creates the student account + links it).
// Returns the child so the parent can register them for a contest and pay.
export const registerChild = async (req, res) => {
  try {
    if (!requireParent(req, res)) return;
    const parentId = req.user.id;
    const { full_name, email, username, password, school, grade } = req.body;

    if (!full_name || !email || !password || !grade) {
      return res.status(400).json({ error: "Full name, email, password and grade are required" });
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) return res.status(400).json({ error: "Enter a valid email address" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const cEmail = String(email).trim().toLowerCase();
    const cName = String(full_name).trim().toUpperCase();
    const cSchool = school ? String(school).trim().toUpperCase() : null;
    const uname = username ? String(username).trim() : null;

    const exists = await pool.query(
      "SELECT * FROM students WHERE email=? OR (username IS NOT NULL AND username=?)",
      [cEmail, uname],
    );
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "A student with that email/username already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO students (full_name, email, username, password, school, grade)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cName, cEmail, uname, hashed, cSchool, grade],
    );

    await pool.query(
      `INSERT INTO parent_links (parent_id, student_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=id`,
      [parentId, result.insertId],
    );

    res.json({
      success: true,
      message: "Child registered and linked to your account.",
      child: { id: result.insertId, full_name: cName, email: cEmail, grade, school: cSchool },
    });
  } catch (error) {
    console.error("PARENT REGISTER CHILD ERROR:", error);
    res.status(500).json({ error: "Could not register child. Please try again." });
  }
};

// 🔐 Parent must own the child before acting on their behalf
const childOwned = async (res, parentId, studentId) => {
  const link = (
    await pool.query(
      "SELECT * FROM parent_links WHERE parent_id=? AND student_id=?",
      [parentId, studentId],
    )
  ).rows[0];
  if (!link) {
    res.status(403).json({ error: "This student is not linked to your account" });
    return false;
  }
  return true;
};

const currentContest = async () => {
  const r = await pool.query(
    "SELECT * FROM contests ORDER BY (registration_open=1) DESC, start_time DESC LIMIT 1",
  );
  return r.rows[0] || null;
};

const ensureRegistration = async (studentId, contestId) => {
  await pool.query(
    `INSERT IGNORE INTO registrations (student_id, contest_id, payment_status)
     VALUES (?, ?, 'pending')`,
    [studentId, contestId],
  );
  const reg = (
    await pool.query(
      "SELECT * FROM registrations WHERE student_id=? AND contest_id=?",
      [studentId, contestId],
    )
  ).rows[0];
  return reg;
};

// 📲 PARENT PAYS FOR A CHILD VIA M-PESA STK (instant — auto marks paid on callback)
export const payChildStk = async (req, res) => {
  try {
    if (!requireParent(req, res)) return;
    const parentId = req.user.id;
    const studentId = Number(req.params.student_id);
    const { phone } = req.body;

    if (!(await childOwned(res, parentId, studentId))) return;
    if (!darajaConfigured()) {
      return res.status(400).json({ error: "M-Pesa STK is not available. Submit a payment code instead." });
    }
    if (!phone) return res.status(400).json({ error: "M-Pesa phone number is required" });

    const contest = await currentContest();
    if (!contest) return res.status(400).json({ error: "No contest is currently open for registration" });
    if (!contest.is_test && contest.entry_fee == null) {
      return res.status(400).json({ error: "This contest has no entry fee set" });
    }

    const reg = await ensureRegistration(studentId, contest.id);

    const normPhone = normalizePhone(phone);
    if (!/^2547\d{8}$/.test(normPhone)) {
      return res.status(400).json({ error: "Enter a valid Safaricom phone number" });
    }

    const amount = Number(contest.entry_fee) || paymentAmount();
    const accountRef = `KMQ${contest.id}-${studentId}`;
    const callbackUrl = `${process.env.PUBLIC_URL || "https://api.kenyamathquest.co.ke"}/api/payment/stk/callback`;

    const result = await stkPush({ phone: normPhone, amount, accountRef, callbackUrl });
    if (String(result.ResponseCode) !== "0") {
      return res.status(400).json({ error: result.ResponseDescription || "STK push failed" });
    }

    await pool.query(
      `INSERT INTO payments (student_id, contest_id, registration_id, status, provider, stk_phone, amount,
         checkout_request_id, merchant_request_id)
       VALUES (?, ?, ?, 'stk_pending', 'stk', ?, ?, ?, ?)`,
      [studentId, contest.id, reg.id, normPhone, amount,
       result.CheckoutRequestID || null, result.MerchantRequestID || null],
    );

    res.json({
      success: true,
      message: "Check your phone and enter your M-Pesa PIN to complete payment.",
      checkout_request_id: result.CheckoutRequestID || null,
    });
  } catch (error) {
    console.error("PARENT STK ERROR:", error);
    res.status(500).json({ error: error.message || "Could not initiate M-Pesa payment" });
  }
};

// 💰 PARENT SUBMITS A MANUAL TRANSACTION CODE FOR A CHILD (goes to admin review)
export const payChildManual = async (req, res) => {
  try {
    if (!requireParent(req, res)) return;
    const parentId = req.user.id;
    const studentId = Number(req.params.student_id);
    const { mpesa_code, proof_text } = req.body;

    if (!(await childOwned(res, parentId, studentId))) return;
    if (!mpesa_code) return res.status(400).json({ error: "M-PESA transaction code is required" });

    const contest = await currentContest();
    if (!contest) return res.status(400).json({ error: "No contest is currently open for registration" });

    const existing = await pool.query(
      "SELECT * FROM payments WHERE student_id=? AND contest_id=? AND status='pending'",
      [studentId, contest.id],
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Payment proof already submitted, awaiting approval" });
    }

    const reg = await ensureRegistration(studentId, contest.id);

    try {
      await pool.query(
        `INSERT INTO payments (student_id, contest_id, registration_id, mpesa_code, proof_text, status, provider)
         VALUES (?, ?, ?, ?, ?, 'pending', 'manual')`,
        [studentId, contest.id, reg.id, String(mpesa_code).trim(), proof_text || null],
      );
    } catch (e) {
      if (e.code === "23505") {
        return res.status(400).json({ error: "This M-PESA code has already been used" });
      }
      throw e;
    }

    res.json({
      success: true,
      message: "Payment code submitted. It will be reviewed and approved by the admin.",
    });
  } catch (error) {
    console.error("PARENT MANUAL PAY ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔓 UNLINK CHILD
export const unlinkChild = async (req, res) => {
  try {
    if (!requireParent(req, res)) return;
    const parentId = req.user.id;
    const studentId = Number(req.params.student_id);

    if (!studentId) return res.status(400).json({ error: "Invalid student" });

    await pool.query(
      "DELETE FROM parent_links WHERE parent_id=? AND student_id=?",
      [parentId, studentId],
    );

    res.json({ success: true, message: "Child unlinked" });
  } catch (error) {
    console.error("UNLINK CHILD ERROR:", error);
    res.status(500).json({ error: "Could not unlink child." });
  }
};

// 📋 CHILD DETAILS — full picture for a linked child
export const getChildDetails = async (req, res) => {
  try {
    if (!requireParent(req, res)) return;
    const parentId = req.user.id;
    const studentId = Number(req.params.student_id);

    if (!studentId) return res.status(400).json({ error: "Invalid student" });

    const link = (
      await pool.query(
        "SELECT * FROM parent_links WHERE parent_id=? AND student_id=?",
        [parentId, studentId],
      )
    ).rows[0];
    if (!link) {
      return res.status(403).json({ error: "This student is not linked to your account" });
    }

    const student = (
      await pool.query(
        `SELECT id, full_name, email, username, school, grade, county,
                student_phone, parent_phone, created_at
         FROM students WHERE id=?`,
        [studentId],
      )
    ).rows[0];
    if (!student) return res.status(404).json({ error: "Student not found" });

    const contestRes = await pool.query(
      "SELECT * FROM contests ORDER BY start_time DESC LIMIT 1",
    );
    const contest = contestRes.rows[0] || null;
    const contestId = contest?.id ?? 0;

    const [regRes, currentRes, historyRes, certRes] = await Promise.all([
      pool.query(
        "SELECT payment_status FROM registrations WHERE student_id=? AND contest_id=?",
        [studentId, contestId],
      ),
      pool.query(
        "SELECT score, percentage, grade, completed, marked, timed_out FROM results WHERE student_id=? AND contest_id=?",
        [studentId, contestId],
      ),
      pool.query(
        `SELECT r.id, c.id AS contest_id, c.name AS contest_name, c.year, c.is_test, c.start_time,
                r.score, r.percentage, r.grade AS result_grade, r.completed, r.timed_out, r.marked,
                rg.payment_status
         FROM results r
         JOIN contests c ON c.id = r.contest_id
         LEFT JOIN registrations rg ON rg.student_id = r.student_id AND rg.contest_id = r.contest_id
         WHERE r.student_id=? AND r.completed=1
         ORDER BY r.created_at DESC`,
        [studentId],
      ),
      pool.query(
        `SELECT c.id, c.contest_id, c.score, c.grade, c.source, c.notes,
                c.file_url, c.created_at, co.name AS contest_name, co.year
         FROM certificates c
         LEFT JOIN contests co ON co.id = c.contest_id
         WHERE c.student_id=? AND c.is_visible=1
         ORDER BY c.created_at DESC`,
        [studentId],
      ),
    ]);

    res.json({
      success: true,
      contest,
      student,
      registered: regRes.rows.length > 0,
      payment_status: regRes.rows[0]?.payment_status || null,
      current_result: currentRes.rows[0] || null,
      history: historyRes.rows,
      certificates: certRes.rows,
    });
  } catch (error) {
    console.error("PARENT CHILD DETAILS ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ⬇️ DOWNLOAD A CERTIFICATE OF A LINKED CHILD (token-gated)
export const downloadChildCertificate = async (req, res) => {
  try {
    if (!requireParent(req, res)) return;
    const parentId = req.user.id;
    const certId = Number(req.params.id);

    if (!certId) return res.status(400).json({ error: "Invalid certificate" });

    const cert = (
      await pool.query("SELECT * FROM certificates WHERE id=? AND is_visible=1", [certId])
    ).rows[0];
    if (!cert) return res.status(404).json({ error: "Certificate not found" });

    const link = (
      await pool.query(
        "SELECT * FROM parent_links WHERE parent_id=? AND student_id=?",
        [parentId, cert.student_id],
      )
    ).rows[0];
    if (!link) {
      return res.status(403).json({ error: "This certificate belongs to a child not linked to your account" });
    }

    const abs = path.join(UPLOADS_DIR, path.basename(cert.file_url || ""));
    if (!fs.existsSync(abs)) {
      return res.status(404).json({ error: "File missing on server" });
    }
    res.download(abs);
  } catch (error) {
    console.error("PARENT CERT DOWNLOAD ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 👥 ADMIN: ALL PARENTS WITH THEIR LINKED CHILDREN (searchable)
export const listParents = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim().toLowerCase();

    const parents = (
      await pool.query(
        `SELECT p.id, p.full_name, p.email, p.username, p.phone, p.created_at
         FROM parents p
         ORDER BY p.id DESC`,
      )
    ).rows;

    const links = (
      await pool.query(
        `SELECT pl.parent_id, s.id AS student_id, s.full_name AS student_name, s.email AS student_email,
                s.school, s.grade
         FROM parent_links pl
         JOIN students s ON s.id = pl.student_id
         ORDER BY s.id`,
      )
    ).rows;

    const byParent = {};
    for (const l of links) {
      (byParent[l.parent_id] = byParent[l.parent_id] || []).push(l);
    }

    const result = parents
      .map((p) => ({ ...p, children: byParent[p.id] || [] }))
      .filter((p) => {
        if (!search) return true;
        const hay = [p.full_name, p.email, p.username, p.phone]
          .concat((p.children || []).map((c) => c.student_name + " " + c.student_email))
          .join(" ")
          .toLowerCase();
        return hay.includes(search);
      });

    res.json({ success: true, parents: result });
  } catch (error) {
    console.error("LIST PARENTS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
