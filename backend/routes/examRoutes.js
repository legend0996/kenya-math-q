import express from "express";
import {
  getExamData,
  acceptInstructions,
  saveDraft,
  submitExam,
  getMyResults,
} from "../controllers/examController.js";
import { getStudentReview } from "../controllers/markingController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:contest_id", verifyToken, getExamData);
router.post("/instructions/accept", verifyToken, acceptInstructions);
router.post("/draft", verifyToken, saveDraft);
router.post("/submit", verifyToken, submitExam);
router.get("/result", verifyToken, getMyResults);
router.get("/review/:contest_id", verifyToken, getStudentReview);

export default router;
