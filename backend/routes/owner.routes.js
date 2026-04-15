import express from "express";
import { verifyOwner } from "../middleware/ownerAuth.js";
import {
  loginOwner,
  getOwnerStats,
  getPendingSchools,
  updateSchoolStatus,
  createContest,
  getAllContests,
  activateContest,
  getRegistrations,
  markPayment,
  createQuestion,
} from "../controllers/owner.controller.js";

const router = express.Router();

router.post("/login", loginOwner);

// 🔒 PROTECTED ROUTES
router.get("/stats", verifyOwner, getOwnerStats);

router.get("/schools/pending", verifyOwner, getPendingSchools);
router.post("/schools/update", verifyOwner, updateSchoolStatus);

router.post("/contest/create", verifyOwner, createContest);
router.get("/contest/all", verifyOwner, getAllContests);
router.post("/contest/activate", verifyOwner, activateContest);
router.post("/question/create", verifyOwner, createQuestion);

router.get("/registrations", verifyOwner, getRegistrations);
router.post("/payment/mark", verifyOwner, markPayment);

export default router;
