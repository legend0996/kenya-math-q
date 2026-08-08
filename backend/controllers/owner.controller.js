import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { issueAuthCookie } from "../utils/auth.js";

const contestStatus = (contest) => {
  const now = new Date();
  const start = new Date(contest.start_time);
  const end = new Date(contest.end_time);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "live";
  return "ended";
};

export const loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM owners WHERE email=?", [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Owner not found" });
    }

    const owner = result.rows[0];
    const valid = await bcrypt.compare(password, owner.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: owner.id, role: "owner" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    issueAuthCookie(res, token);

    res.json({
      success: true,
      token,
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        is_primary: !!owner.is_primary,
        permissions: Array.isArray(owner.permissions) ? owner.permissions : [],
      },
    });
  } catch (error) {
    console.error("OWNER LOGIN ERROR:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

// 📊 DASHBOARD STATS
export const getOwnerStats = async (req, res) => {
  try {
    const students = await pool.query("SELECT COUNT(*) AS count FROM students");
    const schools = await pool.query("SELECT COUNT(*) AS count FROM schools");
    const registered = await pool.query("SELECT COUNT(*) AS count FROM registrations");
    const paid = await pool.query(
      "SELECT COUNT(*) AS count FROM registrations WHERE payment_status='paid'",
    );
    const pendingPayments = await pool.query(
      "SELECT COUNT(*) AS count FROM payments WHERE status='pending'",
    );

    res.json({
      success: true,
      stats: {
        students: students.rows[0].count,
        schools: schools.rows[0].count,
        registered: registered.rows[0].count,
        paid: paid.rows[0].count,
        pending_payments: pendingPayments.rows[0].count,
      },
    });
  } catch (error) {
    console.error("STATS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getPendingSchools = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM schools WHERE status='pending'");
    res.json({ success: true, schools: result.rows });
  } catch (error) {
    console.error("PENDING SCHOOLS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateSchoolStatus = async (req, res) => {
  try {
    const { school_id, status } = req.body;

    if (!school_id || !status) {
      return res.status(400).json({ error: "school_id and status required" });
    }

    await pool.query("UPDATE schools SET status=? WHERE id=?", [status, school_id]);

    res.json({ success: true, message: `School ${status}` });
  } catch (error) {
    console.error("UPDATE SCHOOL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ➕ CREATE CONTEST
export const createContest = async (req, res) => {
  try {
    const { name, contest_number, year, start_time, end_time, entry_fee } = req.body;

    if (!name || !contest_number || !year || !start_time || !end_time) {
      return res.status(400).json({ error: "Missing fields (name, contest_number, year, start_time, end_time)" });
    }

    const fee = Number(entry_fee) > 0 ? Number(entry_fee) : null;

    const result = await pool.query(
      `INSERT INTO contests 
      (name, contest_number, year, start_time, end_time, registration_open, entry_fee)
      VALUES (?,?,?,?,?,true,?)`,
      [name, contest_number, year, start_time, end_time, fee],
    );

    const contest = (
      await pool.query("SELECT * FROM contests WHERE id=?", [result.insertId])
    ).rows[0];

    res.json({ success: true, contest });
  } catch (error) {
    console.error("CREATE CONTEST ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 💵 SET / CHANGE THE ENTRY FEE FOR A CONTEST
export const setEntryFee = async (req, res) => {
  try {
    const { contest_id, entry_fee } = req.body;
    if (!contest_id || entry_fee == null) {
      return res.status(400).json({ error: "contest_id and entry_fee required" });
    }
    const fee = Number(entry_fee) >= 0 ? Number(entry_fee) : 0;
    await pool.query("UPDATE contests SET entry_fee=? WHERE id=?", [fee, contest_id]);
    res.json({ success: true, message: `Entry fee set to KES ${fee}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📡 GET ALL CONTESTS (with smart status)
export const getAllContests = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contests ORDER BY start_time DESC");
    res.json({ success: true, contests: result.rows.map((c) => ({ ...c, status: contestStatus(c) })) });
  } catch (error) {
    console.error("GET CONTESTS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔥 ACTIVATE CONTEST (ONLY ONE ACTIVE)
export const activateContest = async (req, res) => {
  try {
    const { contest_id } = req.body;

    await pool.query("UPDATE contests SET registration_open=false");
    await pool.query("UPDATE contests SET registration_open=true WHERE id=?", [contest_id]);

    res.json({ success: true, message: "Contest activated" });
  } catch (error) {
    console.error("ACTIVATE CONTEST ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔒 CLOSE / OPEN REGISTRATION WINDOW
export const setRegistrationWindow = async (req, res) => {
  try {
    const { contest_id, registration_open } = req.body;
    await pool.query("UPDATE contests SET registration_open=? WHERE id=?", [registration_open, contest_id]);
    res.json({ success: true, message: registration_open ? "Registration opened" : "Registration closed" });
  } catch (error) {
    console.error("SET WINDOW ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📋 GET ALL REGISTRATIONS (with payment status)
export const getRegistrations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        students.id,
        students.full_name,
        students.school,
        students.grade,
        registrations.contest_id,
        registrations.payment_status,
        (registrations.payment_status = 'paid') AS paid
      FROM registrations
      JOIN students ON registrations.student_id = students.id
      ORDER BY registrations.id DESC
    `);

    res.json({ success: true, students: result.rows });
  } catch (error) {
    console.error("REGISTRATIONS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 💰 MARK PAYMENT PAID (admin)
export const markPayment = async (req, res) => {
  try {
    const { student_id, contest_id } = req.body;

    if (!student_id || !contest_id) {
      return res.status(400).json({ error: "student_id and contest_id required" });
    }

    const reg = (
      await pool.query(
        "SELECT * FROM registrations WHERE student_id=? AND contest_id=?",
        [student_id, contest_id],
      )
    ).rows[0];

    const regId = reg?.id || null;

    // upsert payment row
    const existing = await pool.query(
      "SELECT * FROM payments WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );

    if (existing.rows.length > 0) {
      await pool.query(
        "UPDATE payments SET status='paid' WHERE student_id=? AND contest_id=?",
        [student_id, contest_id],
      );
    } else {
      await pool.query(
        `INSERT INTO payments (student_id, contest_id, registration_id, status, mpesa_message)
         VALUES (?, ?, ?, 'paid', 'marked paid by admin')`,
        [student_id, contest_id, regId],
      );
    }

    // mark registration paid
    if (regId) {
      await pool.query("UPDATE registrations SET payment_status='paid' WHERE id=?", [regId]);
    }

    // legacy flag
    await pool.query("UPDATE students SET paid=true WHERE id=?", [student_id]);

    res.json({ success: true, message: "Payment marked as PAID" });
  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ➕ CREATE QUESTION (stores grade + type + marks)
export const createQuestion = async (req, res) => {
  try {
    const {
      contest_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      marks,
type,
      grade,
      working_space,
    } = req.body;

    if (!contest_id || !question || !correct_answer || !grade) {
      return res.status(400).json({ error: "contest_id, question, grade and correct_answer are required" });
    }

    await pool.query(
      `INSERT INTO questions
      (contest_id, question, option_a, option_b, option_c, option_d,
       correct_answer, marks, type, grade, working_space)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        contest_id,
        question,
        option_a || null,
        option_b || null,
        option_c || null,
        option_d || null,
        correct_answer,
        marks || 1,
        type || "mcq",
        grade,
        working_space != null ? Math.min(Math.max(Number(working_space) || 0, 120), 720) : 240,
      ],
    );
    res.json({ success: true, message: "Question added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ⏱ PER-GRADE EXAM DURATION
export const getContestPapers = async (req, res) => {
  try {
    const { contest_id } = req.params;
    const result = await pool.query(
      "SELECT grade, duration_minutes FROM contest_papers WHERE contest_id=?",
      [contest_id],
    );
    res.json({ success: true, papers: result.rows });
  } catch (error) {
    console.error("GET PAPERS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

export const saveContestPapers = async (req, res) => {
  try {
    const { contest_id, papers } = req.body; // papers: [{ grade, duration_minutes }]

    if (!contest_id || !Array.isArray(papers)) {
      return res.status(400).json({ error: "contest_id and papers[] required" });
    }

    for (const p of papers) {
      if (!p.grade || !p.duration_minutes) continue;
      await pool.query(
        `INSERT INTO contest_papers (contest_id, grade, duration_minutes)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE duration_minutes=VALUES(duration_minutes)`,
        [contest_id, p.grade, p.duration_minutes],
      );
    }

    res.json({ success: true, message: "Grade times saved" });
  } catch (error) {
    console.error("SAVE PAPERS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📋 GET ALL QUESTIONS FOR A CONTEST (grouped for the admin editor)
export const getQuestionsByContest = async (req, res) => {
  try {
    const { contest_id } = req.params;
    const rows = (
      await pool.query(
        `SELECT q.id, q.contest_id, q.grade, q.question, q.option_a, q.option_b,
                q.option_c, q.option_d, q.correct_answer, q.marks, q.type, q.working_space,
                q.created_at
         FROM questions q
         WHERE q.contest_id=?
         ORDER BY q.grade, q.id`,
        [contest_id],
      )
    ).rows;
    res.json({ success: true, questions: rows });
  } catch (error) {
    console.error("GET QUESTIONS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✏️ EDIT A QUESTION (including marks)
export const updateQuestion = async (req, res) => {
  try {
    const { question_id } = req.params;
    const {
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      marks,
      grade,
      working_space,
    } = req.body;

    const existing = (await pool.query("SELECT * FROM questions WHERE id=?", [question_id])).rows[0];
    if (!existing) return res.status(404).json({ error: "Question not found" });

    await pool.query(
      `UPDATE questions SET
         grade=?, question=?, option_a=?, option_b=?, option_c=?, option_d=?,
         correct_answer=?, marks=?, working_space=?
       WHERE id=?`,
      [
        grade || existing.grade,
        question ?? existing.question,
        option_a !== undefined ? option_a : existing.option_a,
        option_b !== undefined ? option_b : existing.option_b,
        option_c !== undefined ? option_c : existing.option_c,
        option_d !== undefined ? option_d : existing.option_d,
        correct_answer ?? existing.correct_answer,
        marks != null ? Number(marks) : existing.marks,
        working_space != null ? Number(working_space) : existing.working_space,
        question_id,
      ],
    );

    res.json({ success: true, message: "Question updated" });
  } catch (error) {
    console.error("UPDATE QUESTION ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🗑 DELETE A QUESTION
export const deleteQuestion = async (req, res) => {
  try {
    const { question_id } = req.params;
    await pool.query(
      "DELETE FROM answers WHERE question_id=?",
      [question_id],
    );
    await pool.query(
      "DELETE FROM question_marks WHERE question_id=?",
      [question_id],
    );
    const r = await pool.query("DELETE FROM questions WHERE id=?", [question_id]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Question not found" });
    res.json({ success: true, message: "Question deleted" });
  } catch (error) {
    console.error("DELETE QUESTION ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🏅 RELEASE RESULTS FOR A CONTEST
export const releaseContestResults = async (req, res) => {
  try {
    const { contest_id } = req.params;
    if (!contest_id) {
      return res.status(400).json({ error: "contest_id required" });
    }
    await pool.query("UPDATE contests SET results_released=true WHERE id=?", [contest_id]);
    res.json({ success: true, message: "Results released" });
  } catch (error) {
    console.error("RELEASE RESULTS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 👥 PARTICIPANTS FOR A CONTEST (for certificates)
export const getContestParticipants = async (req, res) => {
  try {
    const { contest_id } = req.params;
    const result = await pool.query(
      `SELECT 
        students.id,
        students.full_name,
        students.school,
        students.grade,
        registrations.payment_status,
        results.score,
        results.grade AS result_grade
      FROM registrations
      JOIN students ON registrations.student_id = students.id
      LEFT JOIN results ON results.student_id = registrations.student_id AND results.contest_id = registrations.contest_id
      WHERE registrations.contest_id=?
      ORDER BY results.score DESC`,
      [contest_id],
    );

    res.json({ success: true, participants: result.rows });
  } catch (error) {
    console.error("PARTICIPANTS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📄 EXPORT CONTEST RESULTS AS CSV
export const exportContestResults = async (req, res) => {
  try {
    const { contest_id } = req.params;

    const contestRes = await pool.query("SELECT name, year FROM contests WHERE id=?", [contest_id]);
    const contest = contestRes.rows[0];

    const result = await pool.query(
      `SELECT
        students.full_name,
        students.school,
        students.grade,
        registrations.payment_status,
        COALESCE(results.score, '') AS score,
        COALESCE(results.grade, '') AS grade,
        CASE WHEN results.timed_out = 1 THEN 'yes' ELSE '' END AS timed_out,
        CASE WHEN results.completed = 1 THEN 'yes' ELSE '' END AS completed
      FROM registrations
      JOIN students ON registrations.student_id = students.id
      LEFT JOIN results ON results.student_id = registrations.student_id AND results.contest_id = registrations.contest_id
      WHERE registrations.contest_id=?
      ORDER BY students.school, results.score DESC`,
      [contest_id],
    );

    const esc = (v) => {
      const s = String(v ?? "").replace(/"/g, '""');
      return `"${s}"`;
    };

    const header = "Full Name,School,Grade,Payment Status,Score,Grade Awarded,Timed Out,Completed\n";
    const body = result.rows
      .map((r) => [r.full_name, r.school, r.grade, r.payment_status, r.score, r.grade, r.timed_out, r.completed].map(esc).join(","))
      .join("\n");

    const name = `results_${contest?.name || "contest"}_${contest?.year || "all"}.csv`.replace(/[^\w.-]/g, "_");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
    res.send(header + body);
  } catch (error) {
    console.error("CSV EXPORT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ── MULTI-ADMIN + PERMISSIONS ────────────────────────────────
// Permission keys: manage_schools | manage_results | reply_support | manage_questions | manage_admin
const normalizePerms = (p) => {
  if (Array.isArray(p)) return p.filter((x) => typeof x === "string");
  return [];
};

export const isPrimary = (req) => !!req.owner?.is_primary;

// Any admin can read the admin list; only a primary admin can modify it
export const getOwners = async (req, res) => {
  try {
    const rows = (await pool.query("SELECT id, name, email, username, is_primary, permissions, created_at FROM owners ORDER BY is_primary DESC, id")).rows;
    res.json({ success: true, owners: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addAdmin = async (req, res) => {
  try {
    if (!isPrimary(req)) return res.status(403).json({ error: "Only the primary admin can add admins" });
    const { name, email, password, username, permissions } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const exists = await pool.query("SELECT id FROM owners WHERE email=?", [email]);
    if (exists.rows.length > 0) return res.status(400).json({ error: "An admin with that email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO owners (name, email, username, password, is_primary, permissions) VALUES (?,?,?,?,0,?)",
      [name || email, email, username || null, hashed, JSON.stringify(normalizePerms(permissions))],
    );
    res.json({ success: true, message: "Admin added" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAdminPermissions = async (req, res) => {
  try {
    if (!isPrimary(req)) return res.status(403).json({ error: "Only the primary admin can change permissions" });
    const { owner_id, permissions } = req.body;
    if (!owner_id) return res.status(400).json({ error: "owner_id required" });
    const target = (await pool.query("SELECT * FROM owners WHERE id=?", [owner_id])).rows[0];
    if (!target) return res.status(404).json({ error: "Admin not found" });
    if (target.is_primary) return res.status(400).json({ error: "Cannot change the primary admin's permissions" });

    await pool.query("UPDATE owners SET permissions=? WHERE id=?", [JSON.stringify(normalizePerms(permissions)), owner_id]);
    res.json({ success: true, message: "Permissions updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeAdmin = async (req, res) => {
  try {
    if (!isPrimary(req)) return res.status(403).json({ error: "Only the primary admin can remove admins" });
    const { owner_id } = req.params;
    const target = (await pool.query("SELECT * FROM owners WHERE id=?", [owner_id])).rows[0];
    if (!target) return res.status(404).json({ error: "Admin not found" });
    if (target.is_primary) return res.status(400).json({ error: "Cannot remove the primary admin" });
    if (Number(req.owner.id) === Number(owner_id)) return res.status(400).json({ error: "You cannot remove your own account" });

    await pool.query("DELETE FROM owners WHERE id=?", [owner_id]);
    res.json({ success: true, message: "Admin removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── PROMOTE A STUDENT ACCOUNT TO ADMIN ───────────────────────
// Students register normally, then the owner selects them and
// "issues permission" to turn their dashboard into an admin dashboard.
export const getStudents = async (req, res) => {
  try {
    const rows = (
      await pool.query(
        "SELECT id, full_name AS name, email, username, school, grade, is_admin, permissions FROM students ORDER BY is_admin DESC, id",
      )
    ).rows;
    res.json({ success: true, students: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const setStudentAdmin = async (req, res) => {
  try {
    const { student_id, permissions } = req.body;
    if (!student_id) return res.status(400).json({ error: "student_id required" });
    const target = (await pool.query("SELECT * FROM students WHERE id=?", [student_id])).rows[0];
    if (!target) return res.status(404).json({ error: "Student not found" });

    const perms = Array.isArray(permissions) ? permissions : [];
    await pool.query("UPDATE students SET is_admin=1, permissions=? WHERE id=?", [JSON.stringify(perms), student_id]);
    res.json({ success: true, message: "This student's account is now an admin when they log in." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const revokeStudentAdmin = async (req, res) => {
  try {
    const { student_id } = req.params;
    await pool.query("UPDATE students SET is_admin=0, permissions=NULL WHERE id=?", [student_id]);
    res.json({ success: true, message: "Admin role revoked. They'll use the student dashboard again." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── STUDENT DIRECTORY ────────────────────────────────────────
// Full student table for a chosen contest: registration / payment / exam status.
export const getAllStudentsDetailed = async (req, res) => {
  try {
    const contest_id = Number(req.query.contest_id) || null;

    const sql = `
      SELECT
        s.id,
        s.full_name,
        s.email,
        s.student_phone,
        s.parent_phone,
        s.school,
        s.grade,
        s.county,
        s.created_at,
        CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END AS registered,
        CASE WHEN r.id IS NOT NULL AND r.payment_status='paid' THEN 1 ELSE 0 END AS paid,
        CASE WHEN res.id IS NOT NULL AND res.completed=1 THEN 1 ELSE 0 END AS done
      FROM students s
      LEFT JOIN registrations r ON r.student_id=s.id AND r.contest_id=?
      LEFT JOIN results res ON res.student_id=s.id AND res.contest_id=?
      ORDER BY s.grade, s.school, s.full_name
    `;
    const rows = (
      await pool.query(sql, [contest_id, contest_id])
    ).rows.map((r) => ({
      ...r,
      registered: !!r.registered,
      paid: !!r.paid,
      done: !!r.done,
    }));

    res.json({ success: true, students: rows });
  } catch (error) {
    console.error("STUDENT TABLE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ➕ BULK REGISTER STUDENTS FOR A CONTEST (all, or a selected list)
export const registerStudents = async (req, res) => {
  try {
    const { contest_id, student_ids, mark_paid } = req.body;

    if (!contest_id) {
      return res.status(400).json({ error: "contest_id required" });
    }

    let ids = [];
    if (Array.isArray(student_ids) && student_ids.length > 0) {
      ids = [...new Set(student_ids.map((x) => Number(x)))].filter((x) => Number.isFinite(x));
    } else {
      const all = await pool.query("SELECT id FROM students");
      ids = all.rows.map((r) => r.id);
    }
    if (ids.length === 0) {
      return res.json({ success: true, count: 0, message: "No students to register" });
    }

    const paidFlag = mark_paid ? "paid" : "pending";
    const values = ids.map((id) => [id, contest_id, paidFlag]);
    await pool.query(
      "INSERT IGNORE INTO registrations (student_id, contest_id, payment_status) VALUES ?",
      [values],
    );

    if (mark_paid) {
      const placeholders = ids.map(() => "?").join(",");
      await pool.query(
        `UPDATE registrations SET payment_status='paid'
         WHERE contest_id=? AND student_id IN (${placeholders})`,
        [contest_id, ...ids],
      );
      await pool.query(
        `UPDATE students SET paid=1 WHERE id IN (${placeholders})`,
        ids,
      );
      await syncBulkPayments(contest_id, ids);
    }

    res.json({
      success: true,
      count: ids.length,
      message: `${ids.length} student(s) registered${mark_paid ? " and marked as paid" : ""}`,
    });
  } catch (error) {
    console.error("BULK REGISTER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 💰 BULK MARK SELECTED REGISTRATIONS AS PAID
export const markStudentsPaid = async (req, res) => {
  try {
    const { contest_id, student_ids } = req.body;

    if (!contest_id || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: "contest_id and student_ids[] required" });
    }

    const ids = [...new Set(student_ids.map((x) => Number(x)))].filter((x) => Number.isFinite(x));
    const placeholders = ids.map(() => "?").join(",");

    // Ensure a registration row exists so payment can be linked
    const values = ids.map((id) => [id, contest_id, "paid"]);
    await pool.query(
      "INSERT IGNORE INTO registrations (student_id, contest_id, payment_status) VALUES ?",
      [values],
    );

    await pool.query(
      `UPDATE registrations SET payment_status='paid' WHERE contest_id=? AND student_id IN (${placeholders})`,
      [contest_id, ...ids],
    );
    await pool.query(`UPDATE students SET paid=1 WHERE id IN (${placeholders})`, ids);

    await syncBulkPayments(contest_id, ids);

    res.json({ success: true, count: ids.length, message: `${ids.length} student(s) marked as paid` });
  } catch (error) {
    console.error("BULK PAYMENT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// Upsert payments rows for a set of (contest_id, student_ids) so the admin bulk
// actions mirror the single markPayment flow (update existing / insert missing).
const syncBulkPayments = async (contest_id, ids) => {
  const placeholders = ids.map(() => "?").join(",");
  const regRows = (
    await pool.query(
      `SELECT id, student_id FROM registrations WHERE contest_id=? AND student_id IN (${placeholders})`,
      [contest_id, ...ids],
    )
  ).rows;

  const existing = (
    await pool.query(
      `SELECT student_id FROM payments WHERE contest_id=? AND student_id IN (${placeholders})`,
      [contest_id, ...ids],
    )
  ).rows.map((r) => r.student_id);

  const inserts = regRows.filter((r) => !existing.includes(r.student_id));
  const updates = regRows.filter((r) => existing.includes(r.student_id));

  if (inserts.length > 0) {
    await pool.query(
      `INSERT INTO payments (student_id, contest_id, registration_id, status, mpesa_message)
       VALUES ?`,
      [inserts.map((r) => [r.student_id, contest_id, r.id, "paid", "marked paid by admin (bulk)"])],
    );
  }
  for (const r of updates) {
    await pool.query(
      "UPDATE payments SET registration_id=?, status='paid' WHERE student_id=? AND contest_id=?",
      [r.id, r.student_id, contest_id],
    );
  }
};

// 🗓 SET PER-GRADE CONTEST DAYS (grade_schedule JSON on contests)
// Map of grade → { start, end } (ISO). Grades not in the map use the global window.
export const setContestGradeSchedule = async (req, res) => {
  try {
    const { contest_id, grade_schedule } = req.body;

    if (!contest_id) {
      return res.status(400).json({ error: "contest_id required" });
    }

    const cleaned = {};
    if (grade_schedule && typeof grade_schedule === "object") {
      for (const [grade, slot] of Object.entries(grade_schedule)) {
        if (slot && slot.start) {
          cleaned[grade] = {
            start: String(slot.start),
            end: slot.end ? String(slot.end) : String(slot.start),
          };
        }
      }
    }

    await pool.query("UPDATE contests SET grade_schedule=? WHERE id=?", [
      JSON.stringify(cleaned),
      contest_id,
    ]);

    res.json({ success: true, message: "Grade contest days saved" });
  } catch (error) {
    console.error("GRADE SCHEDULE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🧹 Wipe an attempt for a set of students in one contest so it can be redone.
// Removes answers, per-question marks, the draft session, any result and certificate.
const clearAttemptForStudents = async (contest_id, ids) => {
  const placeholders = ids.map(() => "?").join(",");
  await pool.query(`DELETE FROM answers WHERE contest_id=? AND student_id IN (${placeholders})`, [contest_id, ...ids]);
  await pool.query(`DELETE FROM question_marks WHERE contest_id=? AND student_id IN (${placeholders})`, [contest_id, ...ids]);
  await pool.query(`DELETE FROM exam_sessions WHERE contest_id=? AND student_id IN (${placeholders})`, [contest_id, ...ids]);
  await pool.query(`DELETE FROM results WHERE contest_id=? AND student_id IN (${placeholders})`, [contest_id, ...ids]);
  await pool.query(`DELETE FROM certificates WHERE contest_id=? AND student_id IN (${placeholders})`, [contest_id, ...ids]);
};

// 🔁 RESET A STUDENT'S ATTEMPT SO THEY CAN REPEAT THE EXAM
// Wipes answers, per-question marks, the draft session and any old result/certificate.
export const resetStudentResults = async (req, res) => {
  try {
    const { contest_id, student_ids } = req.body;

    if (!contest_id || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: "contest_id and student_ids[] required" });
    }

    const ids = [...new Set(student_ids.map((x) => Number(x)))].filter((x) => Number.isFinite(x));
    await clearAttemptForStudents(contest_id, ids);

    res.json({ success: true, count: ids.length, message: `${ids.length} student(s) can now retake the exam` });
  } catch (error) {
    console.error("RESET RESULT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🕓 A student who missed an already-ended contest can still take it: grant them
// a personal extension window (contest_reopens). The exam gates check this table
// and skip the "The contest has ended" error for that student.
export const reopenContestForStudents = async (req, res) => {
  try {
    const { contest_id, student_ids } = req.body;
    const days = Math.max(1, Math.min(Number(req.body.days) || 7, 365));

    if (!contest_id || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: "contest_id and student_ids[] required" });
    }

    const ids = [...new Set(student_ids.map((x) => Number(x)))].filter((x) => Number.isFinite(x));
    if (ids.length === 0) return res.status(400).json({ error: "No valid student ids" });

    // A reopened contest lets the student start again from scratch.
    await clearAttemptForStudents(contest_id, ids);

    // Ensure the student is registered & marked paid for this contest — otherwise
    // the exam gate ("Register for the contest first" / "Payment required") would
    // still stop them even though the admin reopened the window.
    const regValues = ids.map(() => "(?, ?, 'paid')").join(", ");
    const regParams = [];
    for (const id of ids) regParams.push(contest_id, id);
    await pool.query(
      `INSERT INTO registrations (contest_id, student_id, payment_status)
       VALUES ${regValues}
       ON DUPLICATE KEY UPDATE payment_status='paid'`,
      regParams,
    );
    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");
      await pool.query(`UPDATE students SET registered=true WHERE id IN (${placeholders})`, ids);
    }

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 19).replace("T", " ");

    const placeholders = ids.map(() => "(?, ?, ?, ?)").join(", ");
    const params = [];
    for (const id of ids) {
      params.push(contest_id, id, req.owner.id, expiresAt);
    }
    await pool.query(
      `INSERT INTO contest_reopens (contest_id, student_id, opened_by, expires_at)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE opened_by=VALUES(opened_by), expires_at=VALUES(expires_at)`,
      params,
    );

    res.json({ success: true, count: ids.length, expires_at: expiresAt, message: `${ids.length} student(s) can now take the contest` });
  } catch (error) {
    console.error("REOPEN CONTEST ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📋 List students currently granted access to a contest for reopening
export const getContestReopens = async (req, res) => {
  try {
    const { contest_id } = req.params;
    const r = await pool.query(
      `SELECT cr.contest_id, cr.student_id, s.full_name, s.school, s.grade, cr.expires_at
       FROM contest_reopens cr
       JOIN students s ON s.id = cr.student_id
       WHERE cr.contest_id=?`,
      [contest_id],
    );
    res.json({ success: true, reopens: r.rows });
  } catch (error) {
    console.error("GET REOPENS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🚫 Remove a student's reopen grant (they lose the after-window access).
export const revokeContestReopen = async (req, res) => {
  try {
    const { contest_id, student_ids } = req.body;
    if (!contest_id || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: "contest_id and student_ids[] required" });
    }
    const ids = [...new Set(student_ids.map((x) => Number(x)))].filter((x) => Number.isFinite(x));
    const placeholders = ids.map(() => "?").join(",");
    await pool.query(
      `DELETE FROM contest_reopens WHERE contest_id=? AND student_id IN (${placeholders})`,
      [contest_id, ...ids],
    );

    res.json({ success: true, count: ids.length, message: `${ids.length} reopen grant(s) removed` });
  } catch (error) {
    console.error("REVOKE REOPEN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
