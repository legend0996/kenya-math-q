import express from "express";
import {
  getSchoolStudents,
  addStudentBySchool,
  getSchoolOverview,
} from "../controllers/schoolController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/students", verifyToken, getSchoolStudents);
router.post("/add-student", verifyToken, addStudentBySchool);
router.get("/overview", verifyToken, getSchoolOverview);

export default router;
