import express from "express";
import {
  getQuestions,
  submitAnswers,
  releaseResults,
  getMyResults,
  generateCertificates,
  downloadCertificate,
} from "../controllers/examController.js";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:contest_id", verifyToken, getQuestions);
router.post("/submit", verifyToken, submitAnswers);
router.post("/generate-certificates", verifyToken, requireAdmin, generateCertificates);
router.get("/certificate", verifyToken, downloadCertificate);
// 🔥 NEW
router.post("/release", verifyToken, requireAdmin, releaseResults);
router.get("/result", verifyToken, getMyResults);

export default router;
