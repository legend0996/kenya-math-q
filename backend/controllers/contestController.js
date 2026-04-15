import pool from "../config/db.js";

// 🚀 CREATE CONTEST (ADMIN)
export const createContest = async (req, res) => {
  try {
    const { name, contest_number, year, start_time, end_time } = req.body;

    // ✅ Validation
    if (!name || !contest_number || !year || !start_time || !end_time) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      `INSERT INTO contests 
      (name, contest_number, year, start_time, end_time, registration_open)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *`,
      [name, contest_number, year, start_time, end_time],
    );

    return res.status(201).json({
      success: true,
      message: "Contest created successfully",
      contest: result.rows[0],
    });
  } catch (error) {
    console.error("❌ CREATE CONTEST ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
};

// 🚀 GET CURRENT CONTEST (SMART STATUS)
export const getActiveContest = async (req, res) => {
  try {
    console.log("📡 Fetching contest...");

    const result = await pool.query(
      `SELECT * FROM contests 
       WHERE registration_open = true 
       ORDER BY start_time DESC 
       LIMIT 1`,
    );

    // ❌ No contest
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        status: "none",
      });
    }

    const contest = result.rows[0];

    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);

    let status = "none";

    if (now < start) {
      status = "upcoming";
    } else if (now >= start && now <= end) {
      status = "live";
    } else {
      status = "ended";
    }

    return res.json({
      success: true,
      id: contest.id,
      name: contest.name,
      contest_number: contest.contest_number,
      year: contest.year,
      start_time: contest.start_time,
      end_time: contest.end_time,
      status,
    });
  } catch (error) {
    console.error("❌ GET CONTEST ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
};
export const getContestHistory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM contests 
       ORDER BY start_time DESC`,
    );

    res.json({
      success: true,
      contests: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
import pool from "../config/db.js";

// 📝 REGISTER STUDENT TO CONTEST
export const registerStudentToContest = async (req, res) => {
  try {
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({
        error: "student_id required",
      });
    }

    await pool.query("UPDATE students SET registered=true WHERE id=$1", [
      student_id,
    ]);

    res.json({
      success: true,
      message: "Student registered for contest",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 💰 MARK PAYMENT
export const markPayment = async (req, res) => {
  try {
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({
        error: "student_id required",
      });
    }

    await pool.query("UPDATE students SET paid=true WHERE id=$1", [student_id]);

    res.json({
      success: true,
      message: "Payment confirmed",
    });
  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🎯 GET ELIGIBLE STUDENTS
export const getEligibleStudents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM students 
       WHERE registered=true AND paid=true`,
    );

    res.json({
      success: true,
      students: result.rows,
    });
  } catch (error) {
    console.error("ELIGIBLE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
