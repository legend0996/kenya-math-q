import pool from "../config/db.js";

const computeGrade = (pct) => {
  if (pct >= 80) return "Distinction";
  if (pct >= 60) return "Merit";
  if (pct >= 40) return "Pass";
  return "Credit";
};

// Working can be a JSON array of typed text blocks OR a construction drawing dataURL.
export const parseWorking = (w) => {
  if (w == null) return null;
  if (typeof w === "object") return w;
  if (typeof w !== "string") return w;
  try {
    const p = JSON.parse(w);
    if (Array.isArray(p)) return p; // text blocks
    if (typeof p === "string") return p;
  } catch {
    /* not JSON — plain string (legacy drawing) */
  }
  return w;
};

// 📋 CONTESTS WITH SUBMISSIONS (to mark)
export const getMarkableContests = async (req, res) => {
  try {
    const rows = (
      await pool.query(
        `SELECT DISTINCT c.id, c.name, c.year, c.cat_total, c.marking_mode,
                COUNT(r.student_id) AS submissions,
                SUM(CASE WHEN r.marked=0 THEN 1 ELSE 0 END) AS unmarked
FROM contests c
         LEFT JOIN results r ON r.contest_id = c.id
         GROUP BY c.id, c.name, c.year, c.cat_total, c.marking_mode
         ORDER BY c.id DESC`,
      )
    ).rows;
    res.json({ success: true, contests: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👥 STUDENTS WHO SUBMITTED A GIVEN CONTEST (+ their score/marked status)
export const getSubmissions = async (req, res) => {
  try {
    const { contest_id } = req.params;
    const rows = (
      await pool.query(
        `SELECT r.student_id, s.full_name AS name, s.school, s.grade,
                r.score, r.percentage, r.marked
         FROM results r
         JOIN students s ON s.id = r.student_id
         WHERE r.contest_id=?
         ORDER BY r.id`,
        [contest_id],
      )
    ).rows;
    res.json({ success: true, submissions: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📝 MARKING WORKSHEET for one student — questions + their answers + working + saved marks
export const getMarking = async (req, res) => {
  try {
    const { contest_id, student_id } = req.params;
    const grade = (await pool.query("SELECT grade FROM students WHERE id=?", [student_id])).rows[0]?.grade;
    if (!grade) return res.status(404).json({ error: "Student not found" });

    const contest = (await pool.query("SELECT id, name, cat_total FROM contests WHERE id=?", [contest_id])).rows[0];
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    const questions = (
      await pool.query(
        "SELECT * FROM questions WHERE contest_id=? AND grade=? ORDER BY id",
        [contest_id, grade],
      )
    ).rows;

    const answers = (
      await pool.query(
        "SELECT * FROM answers WHERE student_id=? AND contest_id=?",
        [student_id, contest_id],
      )
    ).rows;
    const ansMap = {};
    for (const a of answers) ansMap[a.question_id] = a;

    const marks = (
      await pool.query(
        "SELECT * FROM question_marks WHERE student_id=? AND contest_id=?",
        [student_id, contest_id],
      )
    ).rows;
    const markMap = {};
    for (const m of marks) markMap[m.question_id] = m;

    const result = (
      await pool.query(
        "SELECT score, percentage, cat_total FROM results WHERE student_id=? AND contest_id=?",
        [student_id, contest_id],
      )
    ).rows[0];

    const worksheet = questions.map((q) => ({
      question_id: q.id,
      question: q.question,
      type: q.type,
      marks: q.marks || 1,
      correct_answer: q.correct_answer,
      student_answer: (ansMap[q.id]?.final_answer || ansMap[q.id]?.answer) || "",
      final_answer: ansMap[q.id]?.final_answer || "",
      working: parseWorking(ansMap[q.id]?.working),
      awarded: markMap[q.id] ? Number(markMap[q.id].marks_awarded) : null,
      annotation: markMap[q.id]?.annotation || null,
    }));

    res.json({
      success: true,
      contest: { id: contest.id, name: contest.name, cat_total: contest.cat_total ? Number(contest.cat_total) : null },
      student: { id: Number(student_id), grade },
      totals: result ? { score: Number(result.score || 0), percentage: result.percentage != null ? Number(result.percentage) : null, marked: !!result.marked } : { score: 0, percentage: null, marked: false },
      worksheet,
      questions_total_marks: worksheet.reduce((a, q) => a + q.marks, 0),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ SAVE MARKING — marks per question, optional CAT total, auto percentage
export const saveMarking = async (req, res) => {
  try {
    const { contest_id, student_id, cat_total, marks } = req.body;
    if (!contest_id || !student_id || !Array.isArray(marks)) {
      return res.status(400).json({ error: "contest_id, student_id and marks[] required" });
    }

    const grade = (await pool.query("SELECT grade FROM students WHERE id=?", [student_id])).rows[0]?.grade;
    if (!grade) return res.status(404).json({ error: "Student not found" });

    const qRes = await pool.query(
      "SELECT id, marks FROM questions WHERE contest_id=? AND grade=?",
      [contest_id, grade],
    );
    const map = new Map(qRes.rows.map((q) => [q.id, Number(q.marks || 1)]));

    let score = 0;
    const questionTotal = qRes.rows.reduce((a, q) => a + Number(q.marks || 1), 0);

    for (const m of marks) {
      if (!m || !map.has(m.question_id)) continue;
      const awarded = Number(m.marks_awarded) >= 0 ? Number(m.marks_awarded) : 0;
      score += awarded;
      await pool.query(
        `INSERT INTO question_marks (student_id, contest_id, question_id, marks_awarded, annotation, corrected)
         VALUES (?,?,?,?,?,1)
         ON DUPLICATE KEY UPDATE marks_awarded=VALUES(marks_awarded), annotation=VALUES(annotation), corrected=1`,
        [student_id, contest_id, m.question_id, awarded, m.annotation ? String(m.annotation) : null],
      );
    }

    const denominator = cat_total != null && Number(cat_total) > 0 ? Number(cat_total) : questionTotal;
    const percentage = denominator > 0 ? Math.round((score / denominator) * 10000) / 100 : 0;
    const gradeText = computeGrade(percentage);

    await pool.query(
      `INSERT INTO results (student_id, contest_id, score, percentage, cat_total, grade, marked, completed)
       VALUES (?,?,?,?,?,?,1,1)
       ON DUPLICATE KEY UPDATE
         score=VALUES(score), percentage=VALUES(percentage), cat_total=VALUES(cat_total),
         grade=VALUES(grade), marked=1`,
      [student_id, contest_id, score, percentage, denominator, gradeText],
    );

    res.json({ success: true, score, total: denominator, percentage, grade: gradeText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔧 SET contest marking mode ('auto' | 'manual')
export const setMarkingMode = async (req, res) => {
  try {
    const { contest_id, mode } = req.body;
    if (!contest_id) return res.status(400).json({ error: "contest_id required" });
    if (!["auto", "manual"].includes(mode)) return res.status(400).json({ error: "mode must be auto or manual" });
    await pool.query("UPDATE contests SET marking_mode=? WHERE id=?", [mode, contest_id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔓 RELEASE A MANUAL CONTEST — students can then open their own marked paper
export const releaseResults = async (req, res) => {
  try {
    const { contest_id } = req.body;
    if (!contest_id) return res.status(400).json({ error: "contest_id required" });
    await pool.query(
      "UPDATE results SET reviewable=1 WHERE contest_id=?",
      [contest_id],
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔒 UN-RELEASE (hide papers again)
export const hideResults = async (req, res) => {
  try {
    const { contest_id } = req.body;
    if (!contest_id) return res.status(400).json({ error: "contest_id required" });
    await pool.query(
      "UPDATE results SET reviewable=0 WHERE contest_id=?",
      [contest_id],
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👀 STUDENT REVIEW — a student sees their own marked paper, but only for a
// manual contest that the admin has released (results.reviewable=1).
export const getStudentReview = async (req, res) => {
  try {
    const { contest_id } = req.params;
    const student_id = req.studentId;

    const contest = (await pool.query(
      "SELECT id, name, marking_mode, results_released FROM contests WHERE id=?",
      [contest_id],
    )).rows[0];
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    const result = (await pool.query(
      "SELECT reviewable, marked, percentage, cat_total FROM results WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    )).rows[0];

    if (!result?.reviewable || !result.marked) {
      return res.json({ success: false, error: "Your paper has not been released for review yet." });
    }

    const grade = (await pool.query("SELECT grade FROM students WHERE id=?", [student_id])).rows[0]?.grade;

    const questions = (await pool.query(
      "SELECT * FROM questions WHERE contest_id=? AND grade=? ORDER BY id",
      [contest_id, grade],
    )).rows;

    const ansRes = await pool.query(
      "SELECT * FROM answers WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );
    const ansMap = {};
    for (const a of ansRes.rows) {
      if (a.working) ansMap[a.question_id] = a;
    }

    const marksRes = await pool.query(
      "SELECT * FROM question_marks WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );
    const markMap = {};
    for (const m of marksRes.rows) markMap[m.question_id] = m;

    const worksheet = questions.map((q) => ({
      question_id: q.id,
      question: q.question,
      type: q.type,
      marks: q.marks || 1,
      correct_answer: q.correct_answer,
      student_answer: (ansMap[q.id]?.final_answer || ansMap[q.id]?.answer) || "",
      final_answer: ansMap[q.id]?.final_answer || "",
      working: parseWorking(ansMap[q.id]?.working),
      awarded: markMap[q.id] ? Number(markMap[q.id].marks_awarded) : null,
      annotation: markMap[q.id]?.annotation || null,
    }));

    res.json({
      success: true,
      contest: { id: contest.id, name: contest.name },
      result: {
        percentage: result.percentage != null ? Number(result.percentage) : null,
        score_available: !!result.cat_total,
      },
      worksheet,
      questions_total_marks: worksheet.reduce((a, q) => a + q.marks, 0),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
