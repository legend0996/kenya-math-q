import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM owners WHERE email=$1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Owner not found" });
    }

    const owner = result.rows[0];

    const valid = await bcrypt.compare(password, owner.password);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: owner.id,
        role: "owner",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("OWNER LOGIN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
export const getOwnerStats = async (req, res) => {
  try {
    const students = await pool.query("SELECT COUNT(*) FROM students");
    const schools = await pool.query("SELECT COUNT(*) FROM schools");
    const registered = await pool.query("SELECT COUNT(*) FROM registrations");
    const paid = await pool.query(
      "SELECT COUNT(*) FROM payments WHERE status='paid'",
    );

    res.json({
      success: true,
      stats: {
        students: students.rows[0].count,
        schools: schools.rows[0].count,
        registered: registered.rows[0].count,
        paid: paid.rows[0].count,
      },
    });
  } catch (error) {
    console.error("STATS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
export const getPendingSchools = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM schools WHERE status='pending'",
    );

    res.json({
      success: true,
      schools: result.rows,
    });
  } catch (error) {
    console.error("PENDING SCHOOLS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateSchoolStatus = async (req, res) => {
  try {
    const { school_id, status } = req.body;

    if (!school_id || !status) {
      return res.status(400).json({
        error: "school_id and status required",
      });
    }

    await pool.query("UPDATE schools SET status=$1 WHERE id=$2", [
      status,
      school_id,
    ]);

    res.json({
      success: true,
      message: `School ${status}`,
    });
  } catch (error) {
    console.error("UPDATE SCHOOL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
// ➕ CREATE CONTEST
export const createContest = async (req, res) => {
  try {
    const { name, contest_number, year, start_time, end_time } = req.body;

    if (!name || !contest_number || !year) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const result = await pool.query(
      `INSERT INTO contests 
      (name, contest_number, year, start_time, end_time, registration_open)
      VALUES ($1,$2,$3,$4,$5,true)
      RETURNING *`,
      [name, contest_number, year, start_time, end_time],
    );

    res.json({
      success: true,
      contest: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE CONTEST ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📡 GET ALL CONTESTS
export const getAllContests = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM contests ORDER BY start_time DESC",
    );

    res.json({
      success: true,
      contests: result.rows,
    });
  } catch (error) {
    console.error("GET CONTESTS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔥 ACTIVATE CONTEST (ONLY ONE ACTIVE)
export const activateContest = async (req, res) => {
  try {
    const { contest_id } = req.body;

    // deactivate all
    await pool.query("UPDATE contests SET registration_open=false");

    // activate one
    await pool.query("UPDATE contests SET registration_open=true WHERE id=$1", [
      contest_id,
    ]);

    res.json({
      success: true,
      message: "Contest activated",
    });
  } catch (error) {
    console.error("ACTIVATE CONTEST ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
// 📋 GET ALL REGISTERED STUDENTS
export const getRegistrations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        students.id,
        students.full_name,
        students.school,
        students.grade,
        payments.status
      FROM registrations
      JOIN students ON registrations.student_id = students.id
      LEFT JOIN payments 
        ON payments.student_id = students.id 
        AND payments.contest_id = registrations.contest_id
    `);

    res.json({
      success: true,
      students: result.rows,
    });
  } catch (error) {
    console.error("REGISTRATIONS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 💰 MARK PAYMENT
export const markPayment = async (req, res) => {
  try {
    const { student_id, contest_id } = req.body;

    if (!student_id || !contest_id) {
      return res.status(400).json({
        error: "student_id and contest_id required",
      });
    }

    // check if payment exists
    const existing = await pool.query(
      "SELECT * FROM payments WHERE student_id=$1 AND contest_id=$2",
      [student_id, contest_id],
    );

    if (existing.rows.length > 0) {
      await pool.query(
        "UPDATE payments SET status='paid' WHERE student_id=$1 AND contest_id=$2",
        [student_id, contest_id],
      );
    } else {
      await pool.query(
        `INSERT INTO payments (student_id, contest_id, status)
         VALUES ($1,$2,'paid')`,
        [student_id, contest_id],
      );
    }

    res.json({
      success: true,
      message: "Payment marked as PAID",
    });
  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
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
    } = req.body;

    await pool.query(
      `INSERT INTO questions
      (contest_id, question, option_a, option_b, option_c, option_d, correct_answer, marks)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        contest_id,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        marks,
      ],
    );

    res.json({
      success: true,
      message: "Question added",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
