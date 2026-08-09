import pool from "../config/db.js";

const DEFAULT_MINUTES = 10;
const SUBMIT_GRACE_SECONDS = 120;

// MySQL DATETIME (UTC) — pool uses timezone "Z", so keep everything UTC.
const mysqlDatetime = (ms) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

const computeGrade = (score, total) => {
  const pct = total > 0 ? (score / total) * 100 : 0;
  if (pct >= 80) return "Distinction";
  if (pct >= 60) return "Merit";
  if (pct >= 40) return "Pass";
  return "Credit";
};

// Deterministic shuffle so resume order matches the original session
const seededShuffle = (arr, seed) => {
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const normalizeAnswers = (obj) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/^\d+$/.test(k) && typeof v === "string" && v.length <= 5000) {
      out[k] = v;
    }
    // Working drawings are keyed `working_<questionId>` (data URLs, larger cap)
    const wm = /^working_(\d+)$/.exec(k);
    if (wm && typeof v === "string" && v.length <= 400000) {
      out[k] = v;
    }
  }
  return out;
};

const scoreAnswers = (questionRows, answerMap) => {
  let score = 0;
  let total = 0;
  for (const q of questionRows) {
    const marks = q.marks || 1;
    total += marks;
    const given = answerMap[q.id];
    if (given != null && String(q.correct_answer).trim() === String(given).trim()) {
      score += marks;
    }
  }
  return { score, total, grade: computeGrade(score, total) };
};

// Finalize a session (manual submit or auto-submit on expiry)
const finalizeSession = async (student_id, contest_id, questionRows, answerMap, timedOut) => {
  const { score, total, grade } = scoreAnswers(questionRows, answerMap);
  await pool.query(
    `INSERT INTO results (student_id, contest_id, score, grade, completed, timed_out)
     VALUES (?, ?, ?, ?, true, ?)
     ON DUPLICATE KEY UPDATE score=VALUES(score), grade=VALUES(grade), completed=true, timed_out=VALUES(timed_out)`,
    [student_id, contest_id, score, grade, timedOut],
  );
  await pool.query(
    "UPDATE exam_sessions SET status='submitted', updated_at=NOW() WHERE student_id=? AND contest_id=?",
    [student_id, contest_id],
  );
  return { score, grade, total };
};

// For manually-marked contests: mark the attempt submitted but DON'T auto-grade.
// The admin awards marks later via the Marking tab. results.reviewable is turned on
// when the admin releases a manual contest so the student can see their paper.
const finalizeManualSession = async (studentId, contestId, timedOut) => {
  await pool.query(
    `INSERT INTO results (student_id, contest_id, score, marked, completed, timed_out, reviewable)
     VALUES (?, ?, 0, 0, true, ?, 0)
     ON DUPLICATE KEY UPDATE marked=0, completed=true, timed_out=VALUES(timed_out), reviewable=0`,
    [studentId, contestId, timedOut],
  );
  await pool.query(
    "UPDATE exam_sessions SET status='submitted', updated_at=NOW() WHERE student_id=? AND contest_id=?",
    [studentId, contestId],
  );
  return { score: 0, graded: false };
};

const getMarkingMode = async (contest_id) => {
  const c = (await pool.query("SELECT marking_mode FROM contests WHERE id=?", [contest_id])).rows[0];
  return (c?.marking_mode || "auto") === "manual" ? "manual" : "auto";
};

// Each grade may have its own contest day (contests.grade_schedule JSON).
// Grades without a schedule entry fall back to the contest's global window.
const resolveContestWindow = (contest, grade) => {
  const schedule = contest.grade_schedule;
  if (schedule && typeof schedule === "object") {
    const slot = schedule[grade];
    if (slot && slot.start) {
      return { start_time: slot.start, end_time: slot.end || slot.start };
    }
  }
  return { start_time: contest.start_time, end_time: contest.end_time };
};

// An admin may have reopened an ended contest for a specific student so they can
// still take it. Such a grant lets that student past the "has ended" window gate.
const hasReopenGrant = async (student_id, contest_id) => {
  const r = await pool.query(
    "SELECT id FROM contest_reopens WHERE contest_id=? AND student_id=? AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1",
    [contest_id, student_id],
  );
  return r.rows.length > 0;
};

// 🎯 LOAD EXAM / RESUME DRAFT (student identity from token)
export const getExamData = async (req, res) => {
  try {
    const { contest_id } = req.params;
    const student_id = req.user.id;

    const student = await pool.query(
      "SELECT grade, school, full_name FROM students WHERE id=?",
      [student_id],
    );
    if (student.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    const grade = student.rows[0].grade;

    const contest = await pool.query(
      "SELECT id, name, start_time, end_time, status, results_released, is_test, test_open, grade_schedule FROM contests WHERE id=?",
      [contest_id],
    );
    if (contest.rows.length === 0) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // 🔒 Must be registered
    const reg = await pool.query(
      "SELECT * FROM registrations WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );
    if (reg.rows.length === 0) {
      return res.status(403).json({ error: "Register for the contest first", need_registration: true });
    }

    // Test contests can't be taken unless admin started them
    if (contest.rows[0].is_test && !contest.rows[0].test_open) {
      return res.status(403).json({ error: "This test contest is not open" });
    }

    // 🔒 Must have paid (test contests are auto-approved)
    if (!contest.rows[0].is_test && reg.rows[0].payment_status !== "paid") {
      return res.status(403).json({
        error: "Payment required before starting the exam",
        payment_required: true,
      });
    }

    // Already submitted?
    const result = await pool.query(
      "SELECT * FROM results WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );
    const sessionRes = await pool.query(
      "SELECT * FROM exam_sessions WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );

    if (result.rows.length > 0 || sessionRes.rows[0]?.status === "submitted") {
      return res.json({
        success: true,
        submitted: true,
        result: result.rows[0] || null,
        contest: { id: contest.rows[0].id, name: contest.rows[0].name },
      });
    }

    // ⏱ Per-grade duration
    const paper = await pool.query(
      "SELECT duration_minutes FROM contest_papers WHERE contest_id=? AND grade=?",
      [contest_id, grade],
    );
    const totalSeconds = (paper.rows[0]?.duration_minutes || DEFAULT_MINUTES) * 60;

    // Questions for THIS grade only (never send correct_answer to client)
    const questions = await pool.query(
      `SELECT id, question, question_image, option_a, option_b, option_c, option_d, type, marks, working_space
       FROM questions
       WHERE contest_id=? AND grade=?
       ORDER BY id`,
      [contest_id, grade],
    );

    // 📄 Compulsory paper instructions for this grade. If present, they are the
    // FIRST page the student sees; questions are only unlocked once they agree.
    const instructionsRow = (
      await pool.query(
        "SELECT instructions FROM contest_instructions WHERE contest_id=? AND grade=?",
        [contest_id, grade],
      )
    ).rows[0];
    const instructions = instructionsRow?.instructions ? String(instructionsRow.instructions).trim() : "";

    let session = sessionRes.rows[0];
    const needsInstructions =
      instructions.length > 0 && (!session || session.instructions_accepted !== 1);

    if (needsInstructions) {
      // Do NOT start the timer or create a session yet — show instructions first.
      return res.json({
        success: true,
        submitted: false,
        instructions_required: true,
        instructions,
        instructions_accepted: false,
        contest: { id: contest.rows[0].id, name: contest.rows[0].name },
        grade,
      });
    }

    let fresh = false;

    if (!session) {
      const contestRow = contest.rows[0];
      const now = Date.now();
      const win = resolveContestWindow(contestRow, grade);
      const reopened = await hasReopenGrant(student_id, contest_id);
      // Test contests only check the open flag (no fixed window); real contests use start/end time
      if (contestRow.is_test) {
        if (!contestRow.test_open && !reopened) {
          return res.status(403).json({ error: "The test contest is not open" });
        }
      } else {
        if (win.start_time && now < new Date(win.start_time).getTime() && !reopened) {
          return res.status(403).json({ error: "The contest has not started yet" });
        }
        if (win.end_time && now > new Date(win.end_time).getTime() && !reopened) {
          return res.status(403).json({ error: "The contest has ended" });
        }
      }

      await pool.query(
        `INSERT INTO exam_sessions
           (student_id, contest_id, status, current_index, answers, time_remaining, total_seconds,
            started_at, expires_at, shuffle_seed, violations, grade)
         VALUES (?, ?, 'draft', 0, '{}', ?, ?, ?, ?, ?, 0, ?)`,
        [student_id, contest_id, totalSeconds, totalSeconds, mysqlDatetime(now),
         mysqlDatetime(now + totalSeconds * 1000), Math.floor(Math.random() * 90000) + 10000, grade],
      );
      session = (
        await pool.query(
          "SELECT * FROM exam_sessions WHERE student_id=? AND contest_id=?",
          [student_id, contest_id],
        )
      ).rows[0];
      fresh = true;
    }

    const nowMs = Date.now();
    const expiresMs = session.expires_at ? new Date(session.expires_at).getTime() : nowMs + totalSeconds * 1000;

    // ⏰ Expired and never submitted → auto-submit saved draft
    if (nowMs > expiresMs) {
      const answered = Object.keys(session.answers || {}).filter((k) => /^\d+$/.test(k)).length;

      // Nothing was answered — this was never a real attempt. Drop the draft so
      // the student isn't counted as having entered, and let them start fresh
      // (the contest window check below will stop them if it has ended).
      if (answered === 0) {
        await pool.query(
          "DELETE FROM exam_sessions WHERE student_id=? AND contest_id=?",
          [student_id, contest_id],
        );
        return res.json({
          success: true,
          submitted: false,
          not_attempted: true,
          message: "You didn't answer any questions, so this attempt was not recorded.",
          contest: { id: contest.rows[0].id, name: contest.rows[0].name },
        });
      }

      const mode = await getMarkingMode(contest_id);
      if (mode === "manual") {
        await finalizeManualSession(student_id, contest_id, true);
        return res.json({
          success: true,
          submitted: true,
          timed_out: true,
          result: { score: 0, grade: null },
          contest: { id: contest.rows[0].id, name: contest.rows[0].name },
        });
      }
      const auto = await finalizeSession(
        student_id,
        contest_id,
        questions.rows,
        session.answers || {},
        true,
      );
      return res.json({
        success: true,
        submitted: true,
        timed_out: true,
        result: { score: auto.score, grade: auto.grade },
        contest: { id: contest.rows[0].id, name: contest.rows[0].name },
      });
    }

    const timeRemaining = Math.max(0, Math.ceil((expiresMs - nowMs) / 1000));

    // 🔀 Shuffle questions deterministically so the resume order matches
    const shuffled = seededShuffle(questions.rows, session.shuffle_seed || 1);

    res.json({
      success: true,
      submitted: false,
      contest: {
        id: contest.rows[0].id,
        name: contest.rows[0].name,
        end_time: contest.rows[0].end_time,
        status: contest.rows[0].status,
      },
      grade,
      questions: shuffled,
      session: {
        fresh,
        current_index: session.current_index || 0,
        time_remaining: timeRemaining,
        total_seconds: session.total_seconds || totalSeconds,
        violations: session.violations || 0,
      },
      answers: session.answers || {},
    });
  } catch (error) {
    console.error("GET EXAM DATA ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ STUDENT AGREES TO THE INSTRUCTIONS — starts the session/timer now, so the
// instruction-reading time is never counted against the exam.
export const acceptInstructions = async (req, res) => {
  try {
    const { contest_id } = req.body;
    const student_id = req.user.id;
    if (!contest_id) {
      return res.status(400).json({ error: "contest_id required" });
    }

    const reg = await pool.query(
      "SELECT payment_status FROM registrations WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );
    if (reg.rows.length === 0) {
      return res.status(403).json({ error: "Register for the contest first" });
    }

    const contestRow = (await pool.query(
      "SELECT id, is_test, test_open, start_time, end_time, grade_schedule FROM contests WHERE id=?",
      [contest_id],
    )).rows[0];
    if (!contestRow) return res.status(404).json({ error: "Contest not found" });

    const student = (await pool.query("SELECT grade FROM students WHERE id=?", [student_id])).rows[0];
    const win = resolveContestWindow(contestRow, student?.grade);

    const now = Date.now();
    const reopened = await hasReopenGrant(student_id, contest_id);
    if (contestRow.is_test) {
      if (!contestRow.test_open && !reopened) {
        return res.status(403).json({ error: "The test contest is not open" });
      }
    } else {
      if (reg.rows[0].payment_status !== "paid") {
        return res.status(403).json({ error: "Payment required before starting the exam", payment_required: true });
      }
      if (win.start_time && now < new Date(win.start_time).getTime() && !reopened) {
        return res.status(403).json({ error: "The contest has not started yet" });
      }
      if (win.end_time && now > new Date(win.end_time).getTime() && !reopened) {
        return res.status(403).json({ error: "The contest has ended" });
      }
    }

    const paper = await pool.query(
      "SELECT duration_minutes FROM contest_papers WHERE contest_id=? AND grade=?",
      [contest_id, student?.grade],
    );
    const totalSeconds = (paper.rows[0]?.duration_minutes || DEFAULT_MINUTES) * 60;

    const existing = (
      await pool.query("SELECT * FROM exam_sessions WHERE student_id=? AND contest_id=?", [student_id, contest_id])
    ).rows[0];

    if (existing) {
      await pool.query(
        "UPDATE exam_sessions SET instructions_accepted=1, updated_at=NOW() WHERE student_id=? AND contest_id=?",
        [student_id, contest_id],
      );
    } else {
      await pool.query(
        `INSERT INTO exam_sessions
           (student_id, contest_id, status, current_index, answers, time_remaining, total_seconds,
            started_at, expires_at, shuffle_seed, violations, instructions_accepted, grade)
         VALUES (?, ?, 'draft', 0, '{}', ?, ?, ?, ?, ?, 0, 1, ?)`,
        [student_id, contest_id, totalSeconds, totalSeconds, mysqlDatetime(now),
         mysqlDatetime(now + totalSeconds * 1000), Math.floor(Math.random() * 90000) + 10000, student?.grade],
      );
    }

    res.json({ success: true, message: "Instructions accepted — your exam has started" });
  } catch (error) {
    console.error("ACCEPT INSTRUCTIONS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 💾 SAVE DRAFT (auto-save / logout) — timer is always enforced server-side
export const saveDraft = async (req, res) => {
  try {
    const { contest_id, current_index, answers, violations } = req.body;
    const student_id = req.user.id;

    if (!contest_id) {
      return res.status(400).json({ error: "contest_id required" });
    }

    const existing = await pool.query(
      "SELECT id FROM results WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Exam already submitted" });
    }

    const session = await pool.query(
      "SELECT * FROM exam_sessions WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );
    if (session.rows.length === 0) {
      // No session yet — nothing meaningful to save
      return res.json({ success: true, message: "Draft saved" });
    }

    const clampedIndex = Math.max(0, Math.min(Number(current_index) || 0, 100000));

    await pool.query(
      `UPDATE exam_sessions SET
         current_index=?,
         answers=?,
         violations=?,
         updated_at=NOW()
       WHERE student_id=? AND contest_id=?`,
      [clampedIndex, JSON.stringify(normalizeAnswers(answers)),
       Math.max(0, Math.min(Number(violations) || 0, 20)), student_id, contest_id],
    );

    res.json({ success: true, message: "Draft saved" });
  } catch (error) {
    console.error("SAVE DRAFT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ SUBMIT EXAM + AUTO GRADING (student identity from token)
export const submitExam = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { contest_id, answers } = req.body;
    const student_id = req.user.id;

    if (!contest_id || !Array.isArray(answers)) {
      await conn.release();
      return res.status(400).json({ error: "Missing required fields" });
    }

    await conn.beginTransaction();

    // 🔒 Lock the exam session row for this student+contest so a second
    // concurrent submission waits for the first to finish, then sees the
    // result already exists and is rejected.
    const [sessRows] = await conn.query(
      "SELECT * FROM exam_sessions WHERE student_id=? AND contest_id=? FOR UPDATE",
      [student_id, contest_id],
    );
    const session = sessRows[0];

    // The grade is SNAPSHOTTED at session creation so a mid-exam grade change
    // can never silently re-target the paper the student actually sat.
    let grade;
    if (session?.grade) {
      grade = session.grade;
    } else {
      const [sRows] = await conn.query("SELECT grade FROM students WHERE id=?", [student_id]);
      grade = sRows[0]?.grade;
      if (!grade) {
        await conn.rollback();
        await conn.release();
        return res.status(404).json({ error: "Student not found" });
      }
      // Backfill the snapshot for sessions created before the column existed.
      if (session) {
        await conn.query("UPDATE exam_sessions SET grade=? WHERE id=?", [grade, session.id]);
      }
    }

    const [contestRows] = await conn.query("SELECT is_test FROM contests WHERE id=?", [contest_id]);
    const contestRow = contestRows[0];

    // 🔒 Payment gate (test contests are auto-approved)
    const [regRows] = await conn.query(
      "SELECT * FROM registrations WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );
    const reg = regRows[0];
    if (!reg) {
      await conn.rollback();
      await conn.release();
      return res.status(403).json({ error: "Register for the contest first" });
    }
    if (!contestRow?.is_test && reg.payment_status !== "paid") {
      await conn.rollback();
      await conn.release();
      return res.status(403).json({ error: "Payment required before submitting" });
    }

    // 🚫 Prevent multiple submissions (checked again under the row lock)
    const [existing] = await conn.query(
      "SELECT * FROM results WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );
    if (existing.length > 0) {
      await conn.rollback();
      await conn.release();
      return res.status(400).json({ error: "You already submitted this exam" });
    }

    // ⏰ Server-side time enforcement
    const expiresMs = session?.expires_at
      ? new Date(session.expires_at).getTime()
      : null;
    if (expiresMs != null) {
      const nowMs = Date.now();
      if (nowMs > expiresMs + SUBMIT_GRACE_SECONDS * 1000) {
        await conn.rollback();
        await conn.release();
        return res.status(410).json({
          success: false,
          expired: true,
          error: "Time is up — your saved answers were submitted automatically.",
        });
      }
    }

    // Questions with answers + marks for THIS GRADE SNAPSHOT
    const [qRows] = await conn.query(
      `SELECT id, correct_answer, marks FROM questions
       WHERE contest_id=? AND grade=?`,
      [contest_id, grade],
    );
    const questionMap = new Map(qRows.map((q) => [q.id, q]));

    // 💾 Save answers (only for questions in this grade) — includes finger-written working
    const cleanAnswers = [];
    for (const ans of answers) {
      if (!ans || !questionMap.has(ans.question_id)) continue;
      let working = null;
      if (ans.working !== undefined && ans.working !== null) {
        if (Array.isArray(ans.working)) {
          const blocks = ans.working.filter((b) => typeof b === "string");
          working = blocks.join("\n").length <= 400000 ? JSON.stringify(blocks) : null;
        } else if (typeof ans.working === "string" && ans.working.length <= 400000) {
          working = ans.working; // legacy / construction drawing dataURL
        }
      }
      cleanAnswers.push([student_id, contest_id, ans.question_id, String(ans.answer).slice(0, 5000), working, String(ans.answer).slice(0, 5000)]);
    }
    for (const row of cleanAnswers) {
      await conn.query(
        `INSERT INTO answers (student_id, contest_id, question_id, answer, working, final_answer)
         VALUES (?, ?, ?, ?, ?, ?)`,
        row,
      );
    }

    const timedOut = expiresMs != null && Date.now() > expiresMs;

    // Manual contests: answers are saved but an admin marks them later.
    const mode = await getMarkingMode(contest_id);
    if (mode === "manual") {
      await conn.query(
        `INSERT INTO results (student_id, contest_id, score, marked, completed, timed_out, reviewable)
         VALUES (?, ?, 0, 0, true, ?, 0)
         ON DUPLICATE KEY UPDATE marked=0, completed=true, timed_out=VALUES(timed_out), reviewable=0`,
        [student_id, contest_id, timedOut],
      );
      await conn.query(
        "UPDATE exam_sessions SET status='submitted', updated_at=NOW() WHERE student_id=? AND contest_id=?",
        [student_id, contest_id],
      );
      await conn.commit();
      await conn.release();
      return res.json({ success: true, graded: false, timed_out: timedOut, message: "Answers submitted — your paper will be marked manually." });
    }

    const answerMap = {};
    for (const row of cleanAnswers) answerMap[row[2]] = row[3];

    const { score, grade: gradeText, total } = scoreAnswers(qRows, answerMap);
    await conn.query(
      `INSERT INTO results (student_id, contest_id, score, grade, completed, timed_out)
       VALUES (?, ?, ?, ?, true, ?)
       ON DUPLICATE KEY UPDATE score=VALUES(score), grade=VALUES(grade), completed=true, timed_out=VALUES(timed_out)`,
      [student_id, contest_id, score, gradeText, timedOut],
    );
    await conn.query(
      "UPDATE exam_sessions SET status='submitted', updated_at=NOW() WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );

    await conn.commit();
    await conn.release();
    res.json({ success: true, score, grade: gradeText, total, timed_out: timedOut });
  } catch (error) {
    await conn.rollback().catch(() => {});
    await conn.release();
    console.error("SUBMIT ANSWERS ERROR:", error);
    res.status(500).json({ error: "Could not submit the exam. Please try again." });
  }
};

// 📊 GET MY RESULT (student identity from token)
export const getMyResults = async (req, res) => {
  try {
    const { contest_id } = req.query;
    const student_id = req.user.id;

    if (!contest_id) {
      return res.status(400).json({ error: "contest_id required" });
    }

    const contest = await pool.query(
      "SELECT results_released FROM contests WHERE id=?",
      [contest_id],
    );
    if (!contest.rows[0]?.results_released) {
      return res.json({ success: false, message: "Results not released yet" });
    }

    const result = await pool.query(
      "SELECT * FROM results WHERE student_id=? AND contest_id=?",
      [student_id, contest_id],
    );

    res.json({ success: true, result: result.rows[0] || null });
  } catch (error) {
    console.error("GET RESULT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ⏲️ AUTO-SUBMIT EXPIRED SESSIONS (called by scheduler every ~30s)
// Finalizes draft sessions whose timer already ran out, so nobody gets extra time.
export const finalizeExpiredDrafts = async () => {
  const sessions = await pool.query(
    `SELECT student_id, contest_id, answers, grade FROM exam_sessions
     WHERE status='draft' AND expires_at IS NOT NULL AND expires_at < DATE_SUB(NOW(), INTERVAL 130 SECOND)
     LIMIT 500`,
  );

  let done = 0;
  for (const s of sessions.rows) {
    try {
      const answers = (typeof s.answers === "object" && s.answers) ? s.answers : {};
      const answeredCount = Object.keys(answers).filter((k) => /^\d+$/.test(k)).length;

      // Student never answered anything → this is NOT an attempt. Delete the
      // draft so they are not counted as having entered the contest.
      if (answeredCount === 0) {
        await pool.query(
          "DELETE FROM exam_sessions WHERE student_id=? AND contest_id=?",
          [s.student_id, s.contest_id],
        );
        continue;
      }

      const gradeRes = await pool.query(
        "SELECT grade FROM students WHERE id=?",
        [s.student_id],
      );
      let grade = s.grade || gradeRes.rows[0]?.grade;
      if (!grade) continue;

      const qRes = await pool.query(
        `SELECT id, correct_answer, marks FROM questions
         WHERE contest_id=? AND grade=?`,
        [s.contest_id, grade],
      );

      const answerMap = {};
      for (const [qid, val] of Object.entries(answers)) {
        if (/^\d+$/.test(qid)) answerMap[qid] = String(val);
      }

      const mode = await getMarkingMode(s.contest_id);
      if (mode === "manual") {
        await finalizeManualSession(s.student_id, s.contest_id, true);
      } else {
        await finalizeSession(s.student_id, s.contest_id, qRes.rows, answerMap, true);
      }
      done++;
    } catch (e) {
      console.error("AUTO-SUBMIT ERROR:", e.message);
    }
  }
  return done;
};

export { finalizeSession, scoreAnswers, computeGrade };
