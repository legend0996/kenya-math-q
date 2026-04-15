import express from "express";
import {
  registerStudentToContest,
  markPayment,
  getEligibleStudents,
} from "../controllers/contestController.js";

const router = express.Router();

router.post("/register-student", registerStudentToContest);
router.post("/pay", markPayment);
router.get("/eligible", getEligibleStudents);

export default router;
