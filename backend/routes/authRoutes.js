import express from "express";
import {
  registerStudent,
  registerSchool,
  loginStudent,
  loginSchool,
} from "../controllers/authController.js";

const router = express.Router();

// REGISTER
router.post("/student/register", registerStudent);
router.post("/school/register", registerSchool);

// LOGIN
router.post("/student/login", loginStudent);
router.post("/school/login", loginSchool);

export default router;
