import pool from "../config/db.js";

const contestStatus = (contest) => {
  const now = new Date();
  const start = new Date(contest.start_time);
  const end = new Date(contest.end_time);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "live";
  return "ended";
};

// Grade-aware exam window: uses the admin-set per-grade schedule, falling back
// to the contest's global start/end. Mirrors resolveContestWindow in examController.
const gradeWindow = (contest, grade) => {
  const schedule = contest.grade_schedule;
  if (schedule && typeof schedule === "object") {
    const slot = schedule[grade];
    if (slot && slot.start) {
      return { start_time: slot.start, end_time: slot.end || slot.start };
    }
  }
  return { start_time: contest.start_time, end_time: contest.end_time };
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

    // Prefer a contest the admin has reopened for this student (they missed the
    // window but were granted a personal extension), otherwise the current one.
    const reopenedRes = await pool.query(
      `SELECT c.* FROM contest_reopens cr
       JOIN contests c ON c.id = cr.contest_id
       WHERE cr.student_id=? AND (cr.expires_at IS NULL OR cr.expires_at > NOW())
       ORDER BY cr.opens_at DESC LIMIT 1`,
      [student_id],
    );

    const contestRes = reopenedRes.rows.length > 0
      ? { rows: reopenedRes.rows }
      : await pool.query(
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

      const studentRow = (
        await pool.query("SELECT grade FROM students WHERE id=?", [student_id])
      ).rows[0];
      const win = gradeWindow(contest, studentRow?.grade);

      // Test contests have no fixed window — they are "live" only once the admin
      // opens them (test_open), otherwise "upcoming". Real contests use the
      // grade-aware schedule so each grade's day controls the Start button.
      let status, start_time, end_time;
      if (contest.is_test) {
        status = contest.test_open ? "live" : "upcoming";
        start_time = null;
        end_time = null;
      } else {
        start_time = win.start_time;
        end_time = win.end_time;
        status = contestStatus({ start_time: win.start_time, end_time: win.end_time });
      }

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

      const reopen = (
        await pool.query(
          "SELECT id FROM contest_reopens WHERE contest_id=? AND student_id=? AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1",
          [contest.id, student_id],
        )
      ).rows[0];

      res.json({
        success: true,
        contest: {
          id: contest.id,
          name: contest.name,
          year: contest.year,
          is_test: !!contest.is_test,
          start_time,
          end_time,
          status,
          results_released: contest.results_released,
          reopened: !!reopen,
        },
        registered: !!reg,
        payment_status: reg?.payment_status || null,
        result,
        has_draft: !!session && session.status === "draft",
        reopened: !!reopen,
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
