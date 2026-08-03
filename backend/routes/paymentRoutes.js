import express from "express";
import {
  submitPaymentProof,
  initiateStkPush,
  handleStkCallback,
  verifyPayment,
  getAllPayments,
  getPendingPayments,
  getPaymentMethods,
} from "../controllers/paymentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyOwner } from "../middleware/ownerAuth.js";

const router = express.Router();

// Public — payment methods + M-Pesa STK callback (Safaricom)
router.get("/methods", getPaymentMethods);
router.post("/stk/callback", express.json({ type: "*/*" }), handleStkCallback);

// Student
router.post("/submit-proof", verifyToken, submitPaymentProof);
router.post("/stk", verifyToken, initiateStkPush);

// Admin
router.post("/verify", verifyOwner, verifyPayment);
router.get("/", verifyOwner, getAllPayments);
router.get("/pending", verifyOwner, getPendingPayments);

export default router;
