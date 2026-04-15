import pool from "../config/db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// 🧠 GET QUESTIONS
export const getQuestions = async (req, res) => {
  try {
    const { contest_id } = req.params;

    const result = await pool.query(
      "SELECT * FROM questions WHERE contest_id=$1",
      [contest_id],
    );

    res.json({
      success: true,
      questions: result.rows,
    });
  } catch (error) {
    console.error("GET QUESTIONS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 💾 SUBMIT ANSWERS + AUTO GRADING + GRADE
export const submitAnswers = async (req, res) => {
  try {
    const { student_id, contest_id, answers } = req.body;

    if (!student_id || !contest_id || !answers) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // 💾 SAVE ANSWERS
    for (let ans of answers) {
      await pool.query(
        `INSERT INTO answers (student_id, contest_id, question_id, answer)
         VALUES ($1,$2,$3,$4)`,
        [student_id, contest_id, ans.question_id, ans.answer],
      );
    }

    // 🔥 CALCULATE SCORE
    let score = 0;

    for (let ans of answers) {
      const q = await pool.query(
        "SELECT correct_answer FROM questions WHERE id=$1",
        [ans.question_id],
      );

      if (q.rows.length > 0 && q.rows[0].correct_answer === ans.answer) {
        score++;
      }
    }

    // 🎯 GRADE LOGIC
    let grade = "Credit";

    if (score >= 80) grade = "Distinction";
    else if (score >= 60) grade = "Merit";
    else if (score >= 40) grade = "Pass";

    // 💾 SAVE RESULT WITH GRADE
    await pool.query(
      `INSERT INTO results (student_id, contest_id, score, grade)
       VALUES ($1,$2,$3,$4)`,
      [student_id, contest_id, score, grade],
    );

    res.json({
      success: true,
      message: "Exam submitted successfully",
    });
  } catch (error) {
    console.error("SUBMIT ANSWERS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔓 ADMIN: RELEASE RESULTS
export const releaseResults = async (req, res) => {
  try {
    const { contest_id } = req.body;

    if (!contest_id) {
      return res.status(400).json({
        error: "contest_id is required",
      });
    }

    await pool.query("UPDATE contests SET results_released=true WHERE id=$1", [
      contest_id,
    ]);

    res.json({
      success: true,
      message: "Results released successfully",
    });
  } catch (error) {
    console.error("RELEASE RESULTS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📊 STUDENT: GET RESULT (LOCKED)
export const getMyResults = async (req, res) => {
  try {
    const { student_id, contest_id } = req.query;

    if (!student_id || !contest_id) {
      return res.status(400).json({
        error: "student_id and contest_id required",
      });
    }

    const contest = await pool.query(
      "SELECT results_released FROM contests WHERE id=$1",
      [contest_id],
    );

    if (!contest.rows[0] || !contest.rows[0].results_released) {
      return res.json({
        success: false,
        message: "Results not released yet",
      });
    }

    const result = await pool.query(
      `SELECT * FROM results 
       WHERE student_id=$1 AND contest_id=$2`,
      [student_id, contest_id],
    );

    res.json({
      success: true,
      result: result.rows[0] || null,
    });
  } catch (error) {
    console.error("GET RESULT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📄 GENERATE CERTIFICATES
export const generateCertificates = async (req, res) => {
  try {
    const { contest_id } = req.body;

    const results = await pool.query(
      `SELECT results.*, students.full_name
       FROM results
       JOIN students ON results.student_id = students.id
       WHERE results.contest_id=$1`,
      [contest_id],
    );

    for (let r of results.rows) {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
      });

      const fileName = `cert_${r.student_id}.pdf`;
      const filePath = path.join("uploads", fileName);

      doc.pipe(fs.createWriteStream(filePath));

      doc.fontSize(28).text("KENYA MATH QUEST", { align: "center" });

      doc.moveDown();
      doc.fontSize(20).text("Certificate of Achievement", {
        align: "center",
      });

      doc.moveDown(2);

      doc.fontSize(16).text("This is to certify that", {
        align: "center",
      });

      doc.moveDown();

      doc.fontSize(26).text(r.full_name.toUpperCase(), {
        align: "center",
      });

      doc.moveDown();

      doc
        .fontSize(14)
        .text("has successfully participated in Kenya Math Quest", {
          align: "center",
        });

      doc.moveDown();

      doc.text(`Score: ${r.score}   |   Grade: ${r.grade}`, {
        align: "center",
      });

      doc.end();

      // MARK CERTIFICATE READY
      await pool.query(
        `UPDATE results 
         SET certificate_ready=true 
         WHERE id=$1`,
        [r.id],
      );
    }

    res.json({
      success: true,
      message: "Certificates generated",
    });
  } catch (error) {
    console.error("CERTIFICATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
// 📄 DOWNLOAD CERTIFICATE
export const downloadCertificate = async (req, res) => {
  try {
    const { student_id, contest_id } = req.query;

    if (!student_id || !contest_id) {
      return res.status(400).json({
        error: "student_id and contest_id required",
      });
    }

    // 🔍 CHECK RESULT
    const result = await pool.query(
      `SELECT * FROM results 
       WHERE student_id=$1 AND contest_id=$2`,
      [student_id, contest_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Result not found",
      });
    }

    // 🔒 CHECK IF CERTIFICATE READY
    if (!result.rows[0].certificate_ready) {
      return res.json({
        success: false,
        message: "Certificate not ready yet",
      });
    }

    const filePath = `uploads/cert_${student_id}.pdf`;

    // 📥 SEND FILE
    return res.download(filePath);
  } catch (error) {
    console.error("DOWNLOAD CERT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
