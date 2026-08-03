import pool from "../config/db.js";

// 📓 CREATE A TEST CONTEST (per-grade papers/questions added via owner endpoints)
export const createTestContest = async (req, res) => {
  try {
    const { name, duration_minutes } = req.body;
    const title = String(name || "Practice Test").trim();
    const minutes = Math.max(1, Number(duration_minutes) || 10);

    const result = await pool.query(
      `INSERT INTO contests
        (name, contest_number, year, start_time, end_time, registration_open, is_test, test_open)
       VALUES (?, ?, ?, ?, ?, false, true, false)`,
      [title, `TEST-${Date.now()}`, new Date().getFullYear(), new Date(), new Date()],
    );

    // default per-grade duration
    const grades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Form 1", "Form 2", "Form 3", "Form 4"];
    for (const g of grades) {
      await pool.query(
        `INSERT INTO contest_papers (contest_id, grade, duration_minutes) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE duration_minutes=VALUES(duration_minutes)`,
        [result.insertId, g, minutes],
      );
    }
    void minutes;
    res.json({ success: true, message: "Test contest created — add grades/questions", contest_id: result.insertId });
  } catch (error) {
    console.error("CREATE TEST CONTEST ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ▶️ START the test contest instantly (students can register + take it now)
export const startTestContest = async (req, res) => {
  try {
    const { contest_id } = req.body;
    if (!contest_id) return res.status(400).json({ error: "contest_id required" });

    const c = (await pool.query("SELECT * FROM contests WHERE id=? AND is_test=1", [contest_id])).rows[0];
    if (!c) return res.status(404).json({ error: "Test contest not found" });

    await pool.query(
      `UPDATE contests SET test_open=true, started_at=NOW() WHERE id=?`,
      [contest_id],
    );
    res.json({ success: true, message: "Test contest started" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ⏹️ STOP — ends the test instantly
export const stopTestContest = async (req, res) => {
  try {
    const { contest_id } = req.body;
    if (!contest_id) return res.status(400).json({ error: "contest_id required" });

    await pool.query("UPDATE contests SET test_open=false, stopped_at=NOW() WHERE id=? AND is_test=1", [contest_id]);
    res.json({ success: true, message: "Test contest stopped" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📄 LIST TEST CONTESTS (students) — include their question count per grade
export const listTestContests = async (req, res) => {
  try {
    const rows = (await pool.query("SELECT * FROM contests WHERE is_test=1 ORDER BY id DESC")).rows;
    const tests = rows.map((c) => ({
      id: c.id,
      name: c.name,
      test_open: !!c.test_open,
      started_at: c.started_at,
      stopped_at: c.stopped_at,
    }));
    res.json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👁 GET QUESTIONS FOR A TEST (admin) — per grade, to add/edit via createQuestion
export const getTestQuestions = async (req, res) => {
  try {
    const { contest_id } = req.params;
    const rows = (await pool.query("SELECT * FROM questions WHERE contest_id=? ORDER BY grade, id", [contest_id])).rows;
    res.json({ success: true, questions: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};