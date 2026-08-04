import express from "express";
import { authLimiter, loginLimiter } from "../middleware/authMiddleware.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyOwner } from "../middleware/ownerAuth.js";
import {
  registerStudent,
  registerSchool,
  registerParent,
  checkIdentifier,
  loginStudent,
  loginSchool,
  loginParent,
  logout,
  changePassword,
  changeEmail,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// REGISTER (throttled)
router.post("/student/register", authLimiter, registerStudent);
router.post("/school/register", authLimiter, registerSchool);
router.post("/parent/register", authLimiter, registerParent);

// TWO-STEP LOGIN (throttled)
router.post("/check", authLimiter, checkIdentifier);
router.post("/student/login", loginLimiter, loginStudent);
router.post("/school/login", loginLimiter, loginSchool);
router.post("/parent/login", loginLimiter, loginParent);

// ACCOUNT SETTINGS (student/school or owner)
router.post("/change-password", verifyToken, changePassword);
router.post("/change-email", verifyToken, changeEmail);
router.post("/owner/change-password", verifyOwner, changePassword);
router.post("/owner/change-email", verifyOwner, changeEmail);

// PASSWORD RESET (public, code emailed — 15 min expiry)
router.post("/forgot", authLimiter, requestPasswordReset);
router.post("/reset", authLimiter, resetPassword);

// LOGOUT (clears httpOnly cookie)
router.post("/logout", logout);

export default router;