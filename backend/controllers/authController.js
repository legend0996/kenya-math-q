import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// 👨‍🎓 STUDENT REGISTER
export const registerStudent = async (req, res) => {
  try {
    const { full_name, email, password, school, grade } = req.body;

    if (!full_name || !email || !password || !school || !grade) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // 🔍 CHECK IF EXISTS
    const exists = await pool.query("SELECT * FROM students WHERE email=$1", [
      email,
    ]);

    if (exists.rows.length > 0) {
      return res.status(400).json({
        error: "Email already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO students (full_name, email, password, school, grade)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, full_name, email, school, grade`,
      [full_name, email, hashed, school, grade],
    );

    res.json({
      success: true,
      message: "Student registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("REGISTER STUDENT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🏫 SCHOOL REGISTER (PENDING APPROVAL)
export const registerSchool = async (req, res) => {
  try {
    const { name, email, password, county } = req.body;

    if (!name || !email || !password || !county) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // 🔍 CHECK IF EXISTS
    const exists = await pool.query("SELECT * FROM schools WHERE email=$1", [
      email,
    ]);

    if (exists.rows.length > 0) {
      return res.status(400).json({
        error: "School email already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO schools (name, email, password, county, status)
       VALUES ($1,$2,$3,$4,'pending')
       RETURNING id, name, status`,
      [name, email, hashed, county],
    );

    res.json({
      success: true,
      message: "School registered. Await admin approval.",
      school: result.rows[0],
    });
  } catch (error) {
    console.error("REGISTER SCHOOL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 👨‍🎓 STUDENT LOGIN
export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM students WHERE email=$1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const student = user.rows[0];

    const valid = await bcrypt.compare(password, student.password);

    if (!valid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: student.id,
        role: "student",
        school: student.school, // 🔥 IMPORTANT
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
      user: {
        id: student.id,
        name: student.full_name,
        email: student.email,
        school: student.school,
      },
    });
  } catch (error) {
    console.error("LOGIN STUDENT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🏫 SCHOOL LOGIN (CHECK APPROVAL)
export const loginSchool = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM schools WHERE email=$1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(404).json({
        error: "School not found",
      });
    }

    const school = user.rows[0];

    if (school.status !== "approved") {
      return res.status(403).json({
        error: "School not approved yet",
      });
    }

    const valid = await bcrypt.compare(password, school.password);

    if (!valid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: school.id,
        role: "school",
        school: school.name, // 🔥 IMPORTANT
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
      school: {
        id: school.id,
        name: school.name,
        county: school.county,
      },
    });
  } catch (error) {
    console.error("LOGIN SCHOOL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
