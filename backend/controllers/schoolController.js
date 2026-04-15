import pool from "../config/db.js";

// ➕ ADD STUDENT (BY SCHOOL)
export const addStudentBySchool = async (req, res) => {
  try {
    const { full_name, grade, school } = req.body;

    // ✅ Validation
    if (!full_name || !grade || !school) {
      return res.status(400).json({
        error: "full_name, grade and school are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO students (full_name, grade, school)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [full_name, grade, school],
    );

    res.json({
      success: true,
      message: "Student added successfully",
      student: result.rows[0],
    });
  } catch (error) {
    console.error("ADD STUDENT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📋 GET STUDENTS FOR A SCHOOL
export const getSchoolStudents = async (req, res) => {
  try {
    const { school } = req.query;

    // ✅ Validation
    if (!school) {
      return res.status(400).json({
        error: "school is required",
      });
    }

    const result = await pool.query(
      `SELECT * FROM students 
       WHERE school=$1 
       ORDER BY id DESC`,
      [school],
    );

    res.json({
      success: true,
      students: result.rows,
    });
  } catch (error) {
    console.error("GET SCHOOL STUDENTS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
