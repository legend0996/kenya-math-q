import express from "express";
import { registerStudent } from "../controllers/studentController.js";
import { getStudentMaterials, updateStudentClass } from "../controllers/contentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Self-registration is handled via /api/auth/student/register (see authRoutes).
// This legacy bulk-registration endpoint is only reachable by authenticated
// school/owner accounts to avoid anonymous spam and phantom students.
router.post("/register", verifyToken, registerStudent);

// 📚 Revision materials + past tests for the logged-in student (their grade)
router.get("/materials", verifyToken, getStudentMaterials);

// 🎓 Student updates their own class / form / grade
router.post("/update-class", verifyToken, updateStudentClass);

export default router;
