import express from "express";
import {
  getParentDashboard,
  linkChild,
  confirmLinkChild,
  registerChild,
  unlinkChild,
  getChildDetails,
  downloadChildCertificate,
  payChildStk,
  payChildManual,
} from "../controllers/parentController.js";
import { verifyToken, requireParent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", verifyToken, requireParent, getParentDashboard);
router.get("/child/:student_id", verifyToken, requireParent, getChildDetails);
router.get("/certificate/download/:id", verifyToken, requireParent, downloadChildCertificate);
router.post("/link-child", verifyToken, requireParent, linkChild);
router.post("/confirm-link", verifyToken, requireParent, confirmLinkChild);
router.post("/register-child", verifyToken, requireParent, registerChild);
router.post("/child/:student_id/pay-stk", verifyToken, requireParent, payChildStk);
router.post("/child/:student_id/pay-manual", verifyToken, requireParent, payChildManual);
router.delete("/unlink/:student_id", verifyToken, requireParent, unlinkChild);

export default router;