import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { verifyOwner } from "../middleware/ownerAuth.js";
import { verifyToken, requireStudent, resetLimiter } from "../middleware/authMiddleware.js";
import { IMAGE_MIME, sniffImage, sniffPdf } from "../utils/fileGuard.js";
import {
  saveTemplate,
  getTemplate,
  publishTemplate,
  generateCertificates,
  downloadCertificate,
  manualUploadCertificate,
  getMyCertificates,
  downloadMyCertificate,
  deleteCertificate,
  listContestCertificates,
} from "../controllers/certificateController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.join(__dirname, "../uploads/assets");
const MANUAL_DIR = path.join(__dirname, "../uploads/manual");
if (!fs.existsSync(MANUAL_DIR)) fs.mkdirSync(MANUAL_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ASSETS_DIR),
  filename: (req, file, cb) => {
    // Extension derived from a whitelisted mimetype — never trust originalname
    const ext = IMAGE_MIME[file.mimetype]?.ext || "bin";
    cb(null, `asset_${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!IMAGE_MIME[file.mimetype]) {
      return cb(new Error("Only PNG/JPG/WebP images allowed"), false);
    }
    cb(null, true);
  },
});

// Manual certificate uploads: PDF or image
const certStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MANUAL_DIR),
  filename: (req, file, cb) => {
    const ext = file.mimetype === "application/pdf" ? "pdf" : IMAGE_MIME[file.mimetype]?.ext || "bin";
    cb(null, `manual_${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`);
  },
});

const certUpload = multer({
  storage: certStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || IMAGE_MIME[file.mimetype]) return cb(null, true);
    cb(new Error("Only PDF/PNG/JPG files allowed"), false);
  },
});

const router = express.Router();

// 🖼 Upload an image for the certificate (logo/signature/stamp)
router.post("/image", verifyOwner, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  // 🔒 Verify actual file content (magic bytes) — reject spoofed uploads
  const buf = fs.readFileSync(req.file.path);
  const ext = req.file.filename.split(".").pop();
  if (!sniffImage(ext, buf)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "File content does not match an image" });
  }

  res.json({ success: true, url: `/uploads/assets/${req.file.filename}` });
});

// 🎨 Template designer
router.post("/template/save", verifyOwner, saveTemplate);
router.get("/template", verifyOwner, getTemplate);
router.post("/template/publish", verifyOwner, publishTemplate);

// 🎓 Generate + download
router.post("/generate", verifyOwner, generateCertificates);
router.post("/download", resetLimiter, downloadCertificate);

// 📤 Manual certificate upload + allocate to a student
router.post("/manual", verifyOwner, certUpload.single("file"), (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const buf = fs.readFileSync(req.file.path);
  const ext = req.file.filename.split(".").pop();
  const isPdf = ext === "pdf" ? sniffPdf(buf) : sniffImage(ext, buf);
  if (!isPdf) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "File content does not match its type" });
  }
  next();
}, manualUploadCertificate);

// 👨‍🎓 Student's own certificates
router.get("/my", verifyToken, requireStudent, getMyCertificates);
router.get("/my/download/:id", verifyToken, requireStudent, downloadMyCertificate);

// 📚 Owner: list certificates for a contest
router.get("/contest/:contest_id/list", verifyOwner, listContestCertificates);

// 🗑️ Delete (owner)
router.delete("/:id", verifyOwner, deleteCertificate);

export default router;
