import express from "express";
import { loginOwner, getOwnerStats } from "../controllers/owner.controller.js";
import { verifyOwner } from "../middleware/ownerAuth.js";
import {
  loginOwner,
  getOwnerStats,
  getPendingSchools,
  updateSchoolStatus,
} from "../controllers/owner.controller.js";

import {
  createContest,
  getAllContests,
  activateContest,
} from "../controllers/owner.controller.js";

import {
  getRegistrations,
  markPayment,
} from "../controllers/owner.controller.js";

router.get("/registrations", verifyOwner, getRegistrations);
router.post("/payment/mark", verifyOwner, markPayment);

router.post("/contest/create", verifyOwner, createContest);
router.get("/contest/all", verifyOwner, getAllContests);
router.post("/contest/activate", verifyOwner, activateContest);
router.post("/question/create", verifyOwner, createQuestion);

router.get("/schools/pending", verifyOwner, getPendingSchools);
router.post("/schools/update", verifyOwner, updateSchoolStatus);
const router = express.Router();

router.post("/login", loginOwner);

// 🔒 PROTECTED ROUTE
router.get("/stats", verifyOwner, getOwnerStats);

export default router;
