import pool from "../config/db.js";

// Resolve which school a request may act on.
// Schools are locked to their own name (from the JWT); owners may pass ?school=.
const resolveSchool = (req, res) => {
  const role = req.user?.role;
  if (role === "owner") {
    const school = (req.query?.school || req.body?.school || "").trim();
    if (!school) {
      res.status(400).json({ error: "school is required" });
      return null;
    }
    return school;
  }
  if (role === "school") {
    return (req.user?.school || "").trim();
  }
  res.status(403).json({ error: "School access only" });
  return null;
};

// ➕ ADD STUDENT (BY SCHOOL) — school/owner only, school name locked to the token
export const addStudentBySchool = async (req, res) => {
  try {
    const school = resolveSchool(req, res);
    if (school === null) return;

    const { full_name, grade } = req.body;

    // ✅ Validation
    if (!full_name || !grade) {
      return res.status(400).json({
        error: "full_name and grade are required",
      });
    }

    const cName = String(full_name).trim().toUpperCase();

    const result = await pool.query(
      `INSERT INTO students (full_name, grade, school)
       VALUES (?, ?, ?)`,
      [cName, grade, school],
    );

    res.json({
      success: true,
      message: "Student added successfully",
      student: { id: result.insertId, full_name: cName, grade, school },
    });
  } catch (error) {
    console.error("ADD STUDENT ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 📋 GET STUDENTS FOR A SCHOOL — school/owner only; never exposes credentials
export const getSchoolStudents = async (req, res) => {
  try {
    const school = resolveSchool(req, res);
    if (school === null) return;

    const result = await pool.query(
      `SELECT id, full_name, email, grade, school, county, paid, registered, created_at
       FROM students
       WHERE UPPER(school)=UPPER(?)
       ORDER BY id DESC`,
      [school],
    );

    res.json({
      success: true,
      students: result.rows,
    });
  } catch (error) {
    console.error("GET SCHOOL STUDENTS ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 📊 SCHOOL OVERVIEW — current contest + per-student reg/payment/result status
export const getSchoolOverview = async (req, res) => {
  try {
    const school = resolveSchool(req, res);
    if (school === null) return;

    const contestRes = await pool.query(
      "SELECT * FROM contests ORDER BY start_time DESC LIMIT 1",
    );
    const contest = contestRes.rows[0] || null;

    const studentsRes = await pool.query(
      `SELECT s.id, s.full_name, s.grade, s.school,
              r.payment_status, r.status AS reg_status,
              res.score, res.grade AS result_grade,
              res.completed, res.timed_out
       FROM students s
       LEFT JOIN registrations r
         ON r.student_id = s.id AND r.contest_id = ?
       LEFT JOIN results res
         ON res.student_id = s.id AND res.contest_id = ?
       WHERE UPPER(s.school)=UPPER(?)
       ORDER BY s.id DESC`,
      [contest?.id ?? 0, contest?.id ?? 0, school],
    );
    res.json({
      success: true,
      contest,
      students: studentsRes.rows,
    });
  } catch (error) {
    console.error("SCHOOL OVERVIEW ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
};
