import pool from "../config/db.js";

const contestStatus = (contest) => {
  const now = new Date();
  const start = new Date(contest.start_time);
  const end = new Date(contest.end_time);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "live";
  return "ended";
};

// 🚀 CREATE CONTEST (ADMIN)
export const createContest = async (req, res) => {
  try {
    const { name, contest_number, year, start_time, end_time } = req.body;

    if (!name || !contest_number || !year || !start_time || !end_time) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      `INSERT INTO contests 
      (name, contest_number, year, start_time, end_time, registration_open)
      VALUES (?, ?, ?, ?, ?, true)`,
      [name, contest_number, year, start_time, end_time],
    );

    const contest = (
      await pool.query("SELECT * FROM contests WHERE id=?", [result.insertId])
    ).rows[0];

    return res.status(201).json({
      success: true,
      message: "Contest created successfully",
      contest,
    });
  } catch (error) {
    console.error("❌ CREATE CONTEST ERROR:", error);
    return res.status(500).json({ success: false, error: error.message || "Server error" });
  }
};

// 🚀 GET ACTIVE CONTEST (SMART STATUS)
export const getActiveContest = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM contests 
       WHERE registration_open = true 
       ORDER BY start_time DESC 
       LIMIT 1`,
    );    if (result.rows.length === 0) {
      return res.json({ success: true, status: "none" });
    }

    const contest = result.rows[0];
    return res.json({
      success: true,
      id: contest.id,
      name: contest.name,
      contest_number: contest.contest_number,
      year: contest.year,
      start_time: contest.start_time,
      end_time: contest.end_time,
      status: contestStatus(contest),
      entry_fee: contest.entry_fee != null ? Number(contest.entry_fee) : null,
    });
  } catch (error) {
    console.error("❌ GET CONTEST ERROR:", error);
    return res.status(500).json({ success: false, error: error.message || "Server error" });
  }
};

// 📜 GET ALL CONTESTS (public list)
export const getAllContests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM contests 
       ORDER BY start_time DESC`,
    );
    res.json({ success: true, contests: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getContestHistory = getAllContests;

// 📝 STUDENT REGISTERS FOR THE ACTIVE CONTEST (token)
export const registerForContest = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { contest_id } = req.body || {};

    let contest;
    if (contest_id) {
      contest = (await pool.query("SELECT * FROM contests WHERE id=?", [contest_id])).rows[0];
    } else {
      contest = (
        await pool.query(
          "SELECT * FROM contests WHERE registration_open=true ORDER BY start_time DESC LIMIT 1",
        )
      ).rows[0];
    }

    if (!contest) {
      return res.status(400).json({ error: "Registration is currently closed" });
    }

    // Test contests must be admin-started to register
    if (contest.is_test && !contest.test_open) {
      return res.status(403).json({ error: "This test contest is not open right now" });
    }

    const existing = await pool.query(
      "SELECT * FROM registrations WHERE student_id=? AND contest_id=?",
      [student_id, contest.id],
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "You are already registered for this contest" });
    }

    // Test contests need no payment — auto-approve so the exam is instant
    const payment_status = contest.is_test ? "paid" : "pending";
    await pool.query(
      `INSERT INTO registrations (student_id, contest_id, payment_status)
       VALUES (?, ?, ?)`,
      [student_id, contest.id, payment_status],
    );

    await pool.query("UPDATE students SET registered=true WHERE id=?", [student_id]);

    res.json({ success: true, message: "Registered for contest", contest_id: contest.id });
  } catch (error) {
    console.error("REGISTER FOR CONTEST ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🧪 PUBLIC: list admin-started TEST contests a student can practice right now
export const getOpenTestContests = async (req, res) => {
  try {
    const rows = (await pool.query("SELECT id, name, test_open, started_at FROM contests WHERE is_test=1 ORDER BY id DESC LIMIT 20")).rows;
    const tests = rows.map((c) => ({
      id: c.id,
      name: c.name,
      open: !!c.test_open,
      started_at: c.started_at,
    }));
    res.json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📊 STUDENT'S CONTEST STATUS (registration / payment / result / draft)
export const getMyContestStatus = async (req, res) => {
  try {
    const student_id = req.user.id;

    const contestRes = await pool.query(
      "SELECT * FROM contests WHERE registration_open=true ORDER BY start_time DESC LIMIT 1",
    );

    if (contestRes.rows.length === 0) {
      return res.json({ success: true, contest: null });
    }

    const contest = contestRes.rows[0];
    const reg = (
      await pool.query(
        "SELECT * FROM registrations WHERE student_id=? AND contest_id=?",
        [student_id, contest.id],
      )
    ).rows[0];

    const result = (
      await pool.query(
        "SELECT * FROM results WHERE student_id=? AND contest_id=?",
        [student_id, contest.id],
      )
    ).rows[0];

    const session = (
      await pool.query(
        "SELECT status, current_index, time_remaining FROM exam_sessions WHERE student_id=? AND contest_id=?",
        [student_id, contest.id],
      )
    ).rows[0];

    res.json({
      success: true,
      contest: {
        id: contest.id,
        name: contest.name,
        year: contest.year,
        start_time: contest.start_time,
        end_time: contest.end_time,
        status: contestStatus(contest),
        results_released: contest.results_released,
      },
      registered: !!reg,
      payment_status: reg?.payment_status || null,
      result,
      has_draft: !!session && session.status === "draft",
    });
  } catch (error) {
    console.error("MY CONTEST STATUS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🎯 GET ELIGIBLE STUDENTS (paid + registered) — owner only; never exposes credentials
export const getEligibleStudents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT students.id, students.full_name, students.email, students.school,
              students.grade, students.county, students.paid, students.registered
       FROM students
       JOIN registrations ON registrations.student_id = students.id
       WHERE registrations.payment_status='paid'`,
    );

    res.json({ success: true, students: result.rows });
  } catch (error) {
    console.error("ELIGIBLE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
