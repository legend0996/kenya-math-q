import pool from "../config/db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sendCertificateEmail } from "../utils/emailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "../uploads");

// A4 landscape dimensions in points
const PAGE_W = 842;
const PAGE_H = 595;

const ensureUploads = () => {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const assets = path.join(UPLOADS_DIR, "assets");
  if (!fs.existsSync(assets)) fs.mkdirSync(assets, { recursive: true });
};

const makePassword = () =>
  Array.from({ length: 8 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
  ).join("");

const getElement = (template, type) =>
  (template.elements || []).find((e) => e.type === type);

// draw an image element (normalized coords -> points)
const drawImage = (doc, template, type) => {
  const el = getElement(template, type);
  if (!el || !el.url) return null;
  const file = el.url.replace("/uploads/", path.sep).replace(/\//g, path.sep);
  const abs = path.join(__dirname, "..", file);
  if (!fs.existsSync(abs)) return null;
  const x = (el.x || 0) * PAGE_W;
  const y = (el.y || 0) * PAGE_H;
  const w = (el.w || 0.2) * PAGE_W;
  const h = (el.h || 0.15) * PAGE_H;
  doc.image(abs, x, y, { width: w, height: h });
  return { x, y, w, h };
};

const resolveFont = (family) => {
  const f = (family || "Helvetica").toLowerCase();
  if (f.includes("times")) return "Times-Roman";
  if (f.includes("courier")) return "Courier";
  return "Helvetica";
};

// Normalize normalized (0..1) element coords to PDF points
const normalizeEl = (el) => ({
  ...el,
  x: (el.x ?? 0) * PAGE_W,
  y: (el.y ?? 0) * PAGE_H,
  w: (el.w ?? 0.2) * PAGE_W,
  h: (el.h ?? 0.1) * PAGE_H,
});

const fillTokens = (text, ctx) =>
  String(text)
    .replace(/\{name\}/g, ctx.studentName)
    .replace(/\{school\}/g, ctx.school || "")
    .replace(/\{contest\}/g, ctx.contestName)
    .replace(/\{year\}/g, ctx.year)
    .replace(/\{score\}/g, ctx.score != null ? ctx.score : "")
    .replace(/\{grade\}/g, ctx.grade || "")
    .replace(/\{date\}/g, ctx.date)
    .replace(/\{contest_number\}/g, ctx.contestNumber);

const applyTextStyle = (doc, el) => {
  const base = resolveFont(el.fontFamily);
  doc.fontSize(Math.max(6, Math.round((el.fontSize || 28) * PAGE_H / 595)));
  doc.fillColor(el.color || "#0f172a");
  if (el.bold && el.italic) doc.font(`${base}-BoldOblique`);
  else if (el.bold) doc.font(`${base}-Bold`);
  else if (el.italic) doc.font(`${base}-Oblique`);
  else doc.font(base);
};

// Draw one designer element (Publisher-like layout)
const renderElement = (doc, el, ctx) => {
  const n = normalizeEl(el);
  switch (el.type) {
    case "image":
    case "logo":
    case "signature":
    case "stamp": {
      if (!el.url) break;
      const file = el.url.replace("/uploads/", path.sep).replace(/\//g, path.sep);
      const abs = path.join(__dirname, "..", file);
      if (!fs.existsSync(abs)) break;
      doc.image(abs, n.x, n.y, { width: n.w, height: n.h });
      break;
    }
    case "rect": {
      doc.lineWidth(el.borderWidth || 1);
      if (el.radius && el.radius > 0) doc.roundedRect(n.x, n.y, n.w, n.h, Math.max(2, el.radius * 20));
      else doc.rect(n.x, n.y, n.w, n.h);
      if (el.borderColor) doc.strokeColor(el.borderColor).stroke();
      if (el.fill) doc.fillColor(el.fill).fill();
      break;
    }
    case "line": {
      doc.lineWidth(el.lineWidth || 2).strokeColor(el.color || "#0f172a")
        .moveTo(n.x, n.y).lineTo(n.x + n.w, n.y + n.h).stroke();
      break;
    }
    case "text":
    default: {
      const txt = fillTokens(el.text || "", ctx);
      applyTextStyle(doc, el);
      doc.text(txt, n.x, n.y, {
        width: Math.max(10, n.w),
        height: Math.max(10, n.h),
        align: el.align || "left",
        lineBreak: true,
        ellipsis: true,
      });
      break;
    }
  }
};

// Render full template via its element list (fallback: classic layout)
const renderTemplate = (doc, template, ctx) => {
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(template.bg_color || "#ffffff");
  const elements = Array.isArray(template.elements) ? template.elements : [];
  if (elements.length > 0) {
    for (const el of elements) renderElement(doc, el, ctx);
    return;
  }

  // ── classic fallback layout ──
  doc.rect(20, 20, PAGE_W - 40, PAGE_H - 40).lineWidth(3).stroke(template.accent_color || "#2563eb");
  doc.rect(28, 28, PAGE_W - 56, PAGE_H - 56).lineWidth(1).stroke(template.accent_color || "#2563eb");
  drawImage(doc, template, "logo");
  doc.fontSize(16).fillColor(template.text_color || "#0f172a")
    .text(template.subtitle || "KENYA MATH QUEST", 0, 60, { align: "center" });
  doc.fontSize(32).fillColor(template.accent_color || "#2563eb")
    .text(template.title || "Certificate of Achievement", 0, 110, { align: "center" });
  doc.moveDown(2);
  doc.fontSize(15).fillColor(template.text_color || "#0f172a").text("This is to certify that", { align: "center" });
  doc.moveDown();
  doc.fontSize(30).fillColor(template.accent_color || "#2563eb")
    .text(String(ctx.studentName).toUpperCase(), { align: "center" });
  doc.moveDown();
  doc.fontSize(14).text(`from ${ctx.school || ""}`, { align: "center" });
  doc.moveDown();
  doc.fontSize(14).text(`has successfully participated in ${ctx.contestName} (${ctx.year})`, { align: "center" });
  if (ctx.score != null && ctx.grade) {
    doc.moveDown();
    doc.fontSize(14).text(`Score: ${ctx.score}  |  Grade: ${ctx.grade}`, { align: "center" });
  }
  const sig = drawImage(doc, template, "signature");
  if (sig) {
    doc.fontSize(10).fillColor("#64748b")
      .text("Authorized Signature", sig.x, sig.y + sig.h + 4, { width: sig.w, align: "center" });
  }
  drawImage(doc, template, "stamp");
  doc.fontSize(10).fillColor("#64748b")
    .text(`Contest No. ${ctx.contestNumber}  •  ${ctx.date}`, 50, PAGE_H - 40);
};

// 💾 SAVE TEMPLATE (drag-and-drop designer)
export const saveTemplate = async (req, res) => {
  try {
    const {
      contest_id,
      title,
      subtitle,
      bg_color,
      text_color,
      accent_color,
      elements,
    } = req.body;

    if (!contest_id) {
      return res.status(400).json({ error: "contest_id required" });
    }

    const result = await pool.query(
      `INSERT INTO certificate_templates
        (contest_id, title, subtitle, bg_color, text_color, accent_color, elements, updated_at)
       VALUES (?,?,?,?,?,?,?, NOW())
       ON DUPLICATE KEY UPDATE
         title=VALUES(title),
         subtitle=VALUES(subtitle),
         bg_color=VALUES(bg_color),
         text_color=VALUES(text_color),
         accent_color=VALUES(accent_color),
         elements=VALUES(elements),
         updated_at=NOW()`,
      [
        contest_id,
        title || "Certificate of Achievement",
        subtitle || "KENYA MATH QUEST",
        bg_color || "#ffffff",
        text_color || "#0f172a",
        accent_color || "#2563eb",
        JSON.stringify(elements || []),
      ],
    );

    const template = (
      await pool.query("SELECT * FROM certificate_templates WHERE contest_id=?", [contest_id])
    ).rows[0];

    res.json({ success: true, template });
  } catch (error) {
    console.error("SAVE TEMPLATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📥 GET TEMPLATE
export const getTemplate = async (req, res) => {
  try {
    const { contest_id } = req.query;
    const result = await pool.query(
      "SELECT * FROM certificate_templates WHERE contest_id=?",
      [contest_id],
    );
    res.json({ success: true, template: result.rows[0] || null });
  } catch (error) {
    console.error("GET TEMPLATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📢 PUBLISH TEMPLATE (locks design, enables generation)
export const publishTemplate = async (req, res) => {
  try {
    const { contest_id } = req.body;
    if (!contest_id) {
      return res.status(400).json({ error: "contest_id required" });
    }
    const upd = await pool.query(
      `UPDATE certificate_templates SET published=true, updated_at=NOW()
       WHERE contest_id=?`,
      [contest_id],
    );
    if (upd.rowCount === 0) {
      return res.status(404).json({ error: "Template not found. Save it first." });
    }
    const template = (
      await pool.query("SELECT * FROM certificate_templates WHERE contest_id=?", [contest_id])
    ).rows[0];
    res.json({ success: true, message: "Template published", template });
  } catch (error) {
    console.error("PUBLISH TEMPLATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🎓 GENERATE CERTIFICATES FOR ALL PAID STUDENTS (real scores)
export const generateCertificates = async (req, res) => {
  try {
    const { contest_id } = req.body;
    if (!contest_id) {
      return res.status(400).json({ error: "contest_id required" });
    }

    const templateRes = await pool.query(
      "SELECT * FROM certificate_templates WHERE contest_id=?",
      [contest_id],
    );
    const template = templateRes.rows[0];
    if (!template) {
      return res.status(400).json({ error: "Create a certificate template first" });
    }
    if (!template.published) {
      return res.status(400).json({ error: "Publish the template before generating" });
    }

    const contestRes = await pool.query("SELECT * FROM contests WHERE id=?", [contest_id]);
    if (contestRes.rows.length === 0) {
      return res.status(404).json({ error: "Contest not found" });
    }
    const contest = contestRes.rows[0];

    // Paid students
    const studentsRes = await pool.query(
      `SELECT students.* FROM registrations
       JOIN students ON registrations.student_id = students.id
       WHERE registrations.contest_id=? AND registrations.payment_status='paid'`,
      [contest_id],
    );

    if (studentsRes.rows.length === 0) {
      return res.json({ message: "No paid students found", total: 0 });
    }

    // Real results
    const resultsRes = await pool.query("SELECT * FROM results WHERE contest_id=?", [contest_id]);
    const resultsMap = new Map(resultsRes.rows.map((r) => [r.student_id, r]));

    ensureUploads();
    const created = [];

    for (const student of studentsRes.rows) {
      const result = resultsMap.get(student.id);
      const score = result?.score ?? null;
      const gradeText = result?.grade || (score == null ? "Participant" : "");

      const password = makePassword();
      const fileName = `cert_${student.id}_${Date.now()}.pdf`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      renderTemplate(doc, template, {
        studentName: student.full_name || "",
        school: student.school || "",
        contestName: contest.name,
        year: contest.year,
        score,
        grade: gradeText,
        date: new Date().toDateString(),
        contestNumber: contest.contest_number,
      });

      doc.end();
      await new Promise((resolve) => stream.on("finish", resolve));

      // Save record
      const certRes = await pool.query(
        `INSERT INTO certificates
          (student_id, contest_id, score, grade, password, file_url, sent_status, school, template_id)
         VALUES (?,?,?,?,?,?,'unsent',?,?)`,
        [student.id, contest_id, score, gradeText, password, `/uploads/${fileName}`, student.school || null, template.id],
      );
      const cert = {
        id: certRes.insertId,
        student_id: student.id,
        contest_id,
        score,
        grade: gradeText,
        password,
        file_url: `/uploads/${fileName}`,
        sent_status: "unsent",
        school: student.school || null,
        template_id: template.id,
      };

      created.push({ ...cert, full_name: student.full_name });

      // 📧 Email password (guard: only if email configured)
      if (student.email && process.env.EMAIL_USER && !process.env.EMAIL_USER.includes("yourgmail")) {
        try {
          await sendCertificateEmail(student.email, password);
          await pool.query("UPDATE certificates SET sent_status='sent' WHERE id=?", [cert.id]);
        } catch (e) {
          console.error("Email failed for", student.email, e.message);
        }
      }
    }

    res.json({ success: true, message: "Certificates generated", total: created.length, certificates: created });
  } catch (error) {
    console.error("Certificate generation error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 📥 DOWNLOAD CERTIFICATE (public, password-gated)
export const downloadCertificate = async (req, res) => {
  try {
    const { name, contest_id, password } = req.body;

    const studentResult = await pool.query(
      "SELECT * FROM students WHERE LOWER(full_name)=LOWER(?)",
      [name],
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    const student = studentResult.rows[0];

    const reg = await pool.query(
      "SELECT * FROM registrations WHERE student_id=? AND contest_id=?",
      [student.id, contest_id],
    );
    if (reg.rows.length === 0) {
      return res.status(404).json({ error: "No registration found" });
    }
    if (reg.rows[0].payment_status !== "paid") {
      return res.status(403).json({ error: "Certificate unavailable: payment required" });
    }

    const cert = await pool.query(
      "SELECT * FROM certificates WHERE student_id=? AND contest_id=?",
      [student.id, contest_id],
    );
    if (cert.rows.length === 0) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    if (cert.rows[0].password !== password) {
      return res.status(403).json({ error: "Invalid certificate password" });
    }

    const filePath = cert.rows[0].file_url.replace("/uploads/", path.sep).replace(/\//g, path.sep);
    const abs = path.join(UPLOADS_DIR, path.basename(filePath));
    if (!fs.existsSync(abs)) {
      return res.status(404).json({ error: "File missing on server" });
    }
    res.download(abs);
  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 📤 MANUAL CERTIFICATE UPLOAD + ALLOCATE to a specific student
export const manualUploadCertificate = async (req, res) => {
  try {
    const { student_id, contest_id, notes } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!student_id || !contest_id) {
      return res.status(400).json({ error: "student_id and contest_id required" });
    }

    const stu = await pool.query("SELECT id, full_name, school FROM students WHERE id=?", [student_id]);
    if (stu.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const certRes = await pool.query(
      `INSERT INTO certificates
        (student_id, contest_id, file_url, source, notes, is_visible, school, sent_status)
       VALUES (?,?,?,'manual',?,1,?,'unsent')`,
      [student_id, contest_id, `/uploads/manual/${req.file.filename}`, notes || null, stu.rows[0].school || null],
    );

    res.json({
      success: true,
      message: "Certificate uploaded and allocated",
      certificate: {
        id: certRes.insertId,
        student_id,
        contest_id,
        file_url: `/uploads/manual/${req.file.filename}`,
        source: "manual",
        notes: notes || null,
        student_name: stu.rows[0].full_name,
      },
    });
  } catch (error) {
    console.error("MANUAL CERT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📋 MY CERTIFICATES (logged-in student, only visible ones)
export const getMyCertificates = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.contest_id, c.score, c.grade, c.source, c.notes,
              c.file_url, c.created_at, co.name AS contest_name, co.year
       FROM certificates c
       LEFT JOIN contests co ON co.id = c.contest_id
       WHERE c.student_id=? AND c.is_visible=1
       ORDER BY c.created_at DESC`,
      [req.user.id],
    );
    res.json({ success: true, certificates: result.rows });
  } catch (error) {
    console.error("MY CERTS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ⬇️ DOWNLOAD MY CERTIFICATE (token-gated, ownership checked)
export const downloadMyCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await pool.query(
      "SELECT * FROM certificates WHERE id=? AND student_id=? AND is_visible=1",
      [id, req.user.id],
    );
    if (cert.rows.length === 0) {
      return res.status(404).json({ error: "Certificate not found" });
    }
    const abs = path.join(UPLOADS_DIR, path.basename(cert.rows[0].file_url));
    if (!fs.existsSync(abs)) {
      return res.status(404).json({ error: "File missing on server" });
    }
    res.download(abs);
  } catch (error) {
    console.error("MY CERT DOWNLOAD ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🗑️ DELETE A CERTIFICATE (owner only)
export const deleteCertificate = async (req, res) => {
  try {
    const cert = await pool.query("SELECT * FROM certificates WHERE id=?", [req.params.id]);
    if (cert.rows.length === 0) {
      return res.status(404).json({ error: "Certificate not found" });
    }
    const fname = path.basename(cert.rows[0].file_url || "");
    if (fname) fs.unlink(path.join(UPLOADS_DIR, fname), () => {});
    await pool.query("DELETE FROM certificates WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Certificate deleted" });
  } catch (error) {
    console.error("DELETE CERT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 📚 LIST ALL CERTIFICATES FOR A CONTEST (owner view, manual + generated)
export const listContestCertificates = async (req, res) => {
  try {
    const { contest_id } = req.params;
    const result = await pool.query(
      `SELECT c.id, c.student_id, c.score, c.grade, c.source, c.is_visible,
              c.file_url, c.notes, c.created_at, s.full_name
       FROM certificates c
       JOIN students s ON s.id = c.student_id
       WHERE c.contest_id=?
       ORDER BY c.created_at DESC`,
      [contest_id],
    );
    res.json({ success: true, certificates: result.rows });
  } catch (error) {
    console.error("LIST CERTS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
