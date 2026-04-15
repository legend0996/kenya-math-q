import express from "express";
import { generateCertificates, downloadCertificate } from "../controllers/certificateController.js";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 Admin only: generate certificates
router.post("/generate", verifyToken, requireAdmin, generateCertificates);
router.post("/download", downloadCertificate);
export default router;
