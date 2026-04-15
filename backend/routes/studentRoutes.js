import express from "express";
import { registerStudent } from "../controllers/studentController.js";
import { verifyToken, requireStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerStudent);
router.post("/register", verifyToken, requireStudent, registerStudent);

export default router;
