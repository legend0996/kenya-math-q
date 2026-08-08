import express from "express";
import {
  getExamData,
  acceptInstructions,
  saveDraft,
  submitExam,
  getMyResults,
} from "../controllers/examController.js";
import { getStudentReview } from "../controllers/markingController.js";
import { verifyToken, requireStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:contest_id", verifyToken, requireStudent, getExamData);
router.post("/instructions/accept", verifyToken, requireStudent, acceptInstructions);
router.post("/draft", verifyToken, requireStudent, saveDraft);
router.post("/submit", verifyToken, requireStudent, submitExam);
router.get("/result", verifyToken, requireStudent, getMyResults);
router.get("/review/:contest_id", verifyToken, requireStudent, getStudentReview);

export default router;
