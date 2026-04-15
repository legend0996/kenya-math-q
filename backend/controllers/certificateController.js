import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { sendCertificateEmail } from "../utils/emailService.js";

// 🎓 GENERATE CERTIFICATES (ADMIN)
export const generateCertificates = async (req, res) => {
  try {
    const { contest_id } = req.body;

    if (!contest_id) {
      return res.status(400).json({ error: "contest_id is required" });
    }

    // Get paid students
    const result = await pool.query(
      `
      SELECT students.*, registrations.id as reg_id
      FROM registrations
      JOIN students ON registrations.student_id = students.id
      WHERE registrations.contest_id=$1
      AND registrations.payment_status='paid'
    `,
      [contest_id],
    );

    if (result.rows.length === 0) {
      return res.json({ message: "No paid students found" });
    }

    const created = [];

    for (let student of result.rows) {
      const password = uuidv4().slice(0, 8);

      // TEMP score (replace later)
      const score = Math.floor(Math.random() * 100);

      let grade = "D";
      if (score >= 80) grade = "A";
      else if (score >= 60) grade = "B";
      else if (score >= 40) grade = "C";

      // 📄 CREATE PDF
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
      });

      const fileName = `cert_${student.id}_${Date.now()}.pdf`;
      const filePath = path.join("uploads", fileName);

      doc.pipe(fs.createWriteStream(filePath));

      // Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

      // Title
      doc.fontSize(28).text("KENYA MATH QUEST", { align: "center" });

      doc.moveDown(0.5);
      doc.fontSize(20).text("Certificate of Achievement", { align: "center" });

      doc.moveDown(2);

      doc.fontSize(16).text("This is to certify that", { align: "center" });

      doc.moveDown();

      // Name
      doc.fontSize(26).text(student.full_name.toUpperCase(), {
        align: "center",
      });

      doc.moveDown();

      doc
        .fontSize(14)
        .text(
          "has successfully participated in the Kenya Math Quest competition",
          { align: "center" },
        );

      doc.moveDown();

      doc.text(`Score: ${score}   |   Grade: ${grade}`, {
        align: "center",
      });

      doc.moveDown(2);

      // Signature
      const signaturePath = path.join("uploads/assets/signature.png");
      if (fs.existsSync(signaturePath)) {
        doc.image(signaturePath, 150, doc.page.height - 150, { width: 100 });
        doc.text("Authorized Signature", 150, doc.page.height - 40);
      }

      // Stamp
      const stampPath = path.join("uploads/assets/stamp.png");
      if (fs.existsSync(stampPath)) {
        doc.image(stampPath, doc.page.width - 200, doc.page.height - 160, {
          width: 100,
        });
      }

      // Footer
      doc
        .fontSize(10)
        .text(
          `Generated on: ${new Date().toDateString()}`,
          50,
          doc.page.height - 30,
        );

      doc.end();

      // Save in DB
      const cert = await pool.query(
        `INSERT INTO certificates 
        (student_id, contest_id, score, grade, password, file_url)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
        [student.id, contest_id, score, grade, password, filePath],
      );

      created.push(cert.rows[0]);

      // 📧 SEND EMAIL
      if (student.email) {
        await sendCertificateEmail(student.email, password);
      }
    }

    res.json({
      message: "Certificates generated successfully",
      total: created.length,
      certificates: created,
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 📥 DOWNLOAD CERTIFICATE (SECURE)
export const downloadCertificate = async (req, res) => {
  try {
    const { name, contest_id, password } = req.body;

    const studentResult = await pool.query(
      "SELECT * FROM students WHERE LOWER(full_name)=LOWER($1)",
      [name],
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentResult.rows[0];

    const reg = await pool.query(
      `SELECT * FROM registrations 
       WHERE student_id=$1 AND contest_id=$2`,
      [student.id, contest_id],
    );

    if (reg.rows.length === 0) {
      return res.status(404).json({ error: "No registration found" });
    }

    if (reg.rows[0].payment_status !== "paid") {
      return res.status(403).json({
        error: "Certificate unavailable: payment required",
      });
    }

    const cert = await pool.query(
      `SELECT * FROM certificates 
       WHERE student_id=$1 AND contest_id=$2`,
      [student.id, contest_id],
    );

    if (cert.rows.length === 0) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    const certificate = cert.rows[0];

    // 🔐 Password check
    if (certificate.password !== password) {
      return res.status(403).json({
        error: "Invalid certificate password",
      });
    }

    res.download(certificate.file_url);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
