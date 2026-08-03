import pool from "../config/db.js";

// ── CONTEST INSTRUCTIONS (compulsory written paper instructions, one per grade) ──
// Table `contest_instructions` (contest_id, grade, instructions). The student must
// agree before questions are shown (see examController.acceptInstructions).

// owner: all instructions for a contest, one row per grade
export const getContestInstructions = async (req, res) => {
  try {
    const { contest_id } = req.params;
    const rows = (
      await pool.query(
        "SELECT grade, instructions, updated_at FROM contest_instructions WHERE contest_id=? ORDER BY id",
        [contest_id],
      )
    ).rows;
    res.json({ success: true, instructions: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// owner: upsert the instructions for a given grade (admin can change it anytime)
export const saveContestInstructions = async (req, res) => {
  try {
    const { contest_id, grade, instructions } = req.body;
    if (!contest_id || !grade) {
      return res.status(400).json({ error: "contest_id and grade are required" });
    }
    const content =
      typeof instructions === "string" ? instructions.trim() : "";
    await pool.query(
      `INSERT INTO contest_instructions (contest_id, grade, instructions)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE instructions=VALUES(instructions)`,
      [contest_id, grade, content],
    );
    res.json({ success: true, message: content ? "Instructions saved" : "Instructions cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// owner: delete the instructions for a grade
export const deleteContestInstructions = async (req, res) => {
  try {
    const { contest_id, grade } = req.params;
    await pool.query(
      "DELETE FROM contest_instructions WHERE contest_id=? AND grade=?",
      [contest_id, grade],
    );
    res.json({ success: true, message: "Instructions deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── REVISION / STUDY MATERIALS (uploaded by the admin, filtered by grade) ──

// owner: all materials
export const listMaterials = async (req, res) => {
  try {
    const rows = (
      await pool.query("SELECT * FROM revision_materials ORDER BY id DESC")
    ).rows;
    res.json({ success: true, materials: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// owner: create / edit
export const saveMaterial = async (req, res) => {
  try {
    const { id, grade, title, description, content_type, content } = req.body;
    if (!grade || !title) {
      return res.status(400).json({ error: "grade and title are required" });
    }
    const type = ["link", "text", "file"].includes(content_type) ? content_type : "link";
    const body =
      id != null
        ? await pool.query(
            `UPDATE revision_materials
             SET grade=?, title=?, description=?, content_type=?, content=?
             WHERE id=?`,
            [grade, title, description || null, type, content != null ? String(content) : null, id],
          )
        : await pool.query(
            `INSERT INTO revision_materials (grade, title, description, content_type, content)
             VALUES (?, ?, ?, ?, ?)`,
            [grade, title, description || null, type, content != null ? String(content) : null],
          );
    res.json({ success: true, message: "Material saved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// owner: remove
export const deleteMaterial = async (req, res) => {
  try {
    await pool.query("DELETE FROM revision_materials WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Material removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── STUDENT DASHBOARD: revision materials + the past tests the student entered ──
export const getStudentMaterials = async (req, res) => {
  try {
    const student_id = req.user.id;
    const student = (await pool.query("SELECT grade FROM students WHERE id=?", [student_id])).rows[0];
    const grade = student?.grade;

    let materials = [];
    if (grade) {
      materials = (
        await pool.query(
          "SELECT * FROM revision_materials WHERE grade=? ORDER BY id DESC",
          [grade],
        )
      ).rows;
    }

    const pastTests = (
      await pool.query(
        `SELECT DISTINCT c.id, c.name, c.year, c.start_time, c.is_test,
                res.score, res.grade AS result_grade, res.completed
         FROM registrations reg
         JOIN contests c ON c.id = reg.contest_id
         LEFT JOIN results res ON res.student_id = reg.student_id AND res.contest_id = c.id
         WHERE reg.student_id = ?
         ORDER BY c.id DESC`,
        [student_id],
      )
    ).rows;

    res.json({ success: true, grade, materials, pastTests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── STUDENT: change their class / form / grade ──
export const updateStudentClass = async (req, res) => {
  try {
    const { grade } = req.body;
    const student_id = req.user.id;
    if (!grade || typeof grade !== "string" || grade.trim().length === 0) {
      return res.status(400).json({ error: "grade is required" });
    }
    const clean = grade.trim().slice(0, 50);
    await pool.query("UPDATE students SET grade=? WHERE id=?", [clean, student_id]);
    res.json({ success: true, message: "Your class has been updated", grade: clean });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};