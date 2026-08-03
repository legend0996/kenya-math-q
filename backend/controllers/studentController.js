import pool from "../config/db.js";

export const registerStudent = async (req, res) => {
  try {
    const { full_name, parent_phone, student_phone, school_id, grade, county } =
      req.body;

    // 1. Get active contest
    const contestResult = await pool.query(
      "SELECT * FROM contests WHERE registration_open=true LIMIT 1",
    );

    if (contestResult.rows.length === 0) {
      return res.status(400).json({
        error: "Registration is currently closed",
      });
    }

    const contest = contestResult.rows[0];

    // 2. Create student
    const studentResult = await pool.query(
      `INSERT INTO students 
      (full_name, parent_phone, student_phone, school_id, grade, county)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, parent_phone, student_phone, school_id, grade, county],
    );

    const student = {
      id: studentResult.insertId,
      full_name,
      parent_phone,
      student_phone,
      school_id,
      grade,
      county,
    };

    // 3. Create registration
    const registrationResult = await pool.query(
      `INSERT INTO registrations 
      (student_id, contest_id, payment_status)
      VALUES (?, ?, 'pending')`,
      [student.id, contest.id],
    );

    res.status(201).json({
      message: "Registration successful",
      student,
      registration: { id: registrationResult.insertId, student_id: student.id, contest_id: contest.id, payment_status: "pending" },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
