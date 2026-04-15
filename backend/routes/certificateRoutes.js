import express from "express";
import { generateCertificates } from "../controllers/certificateController.js";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";
import { downloadCertificate } from "../controllers/certificateController.js";

const router = express.Router();

// 🔐 Admin only: generate certificates
router.post("/generate", verifyToken, requireAdmin, generateCertificates);
router.post("/download", downloadCertificate);
export default router;
