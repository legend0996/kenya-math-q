import express from "express";
import {
  submitPayment,
  verifyPayment,
  getAllPayments,
} from "../controllers/paymentController.js";

import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Student submits payment
router.post("/submit", verifyToken, submitPayment);

// Admin verifies payment
router.post("/verify", verifyToken, requireAdmin, verifyPayment);

// Admin fetch all payments
router.get("/", verifyToken, requireAdmin, getAllPayments);

export default router;
