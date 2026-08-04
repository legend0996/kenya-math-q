import express from "express";
import {
  getParentDashboard,
  linkChild,
  registerChild,
  unlinkChild,
  getChildDetails,
  downloadChildCertificate,
  payChildStk,
  payChildManual,
} from "../controllers/parentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", verifyToken, getParentDashboard);
router.get("/child/:student_id", verifyToken, getChildDetails);
router.get("/certificate/download/:id", verifyToken, downloadChildCertificate);
router.post("/link-child", verifyToken, linkChild);
router.post("/register-child", verifyToken, registerChild);
router.post("/child/:student_id/pay-stk", verifyToken, payChildStk);
router.post("/child/:student_id/pay-manual", verifyToken, payChildManual);
router.delete("/unlink/:student_id", verifyToken, unlinkChild);

export default router;
