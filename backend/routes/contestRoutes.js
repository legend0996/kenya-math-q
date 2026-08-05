import express from "express";
import {
  createContest,
  getActiveContest,
  getAllContests,
  registerForContest,
  getMyContestStatus,
  getEligibleStudents,
} from "../controllers/contestController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyOwner } from "../middleware/ownerAuth.js";
import { getOpenTestContests } from "../controllers/contestController.js";
import { getTuitionVideos } from "../controllers/contentController.js";

const router = express.Router();

// Public contest info
router.get("/current", getActiveContest);
router.get("/history", getAllContests);
router.get("/all", getAllContests);
router.get("/test", getOpenTestContests);

// Public tuition page (streamed YouTube videos added by the admin)
router.get("/tuition/videos", getTuitionVideos);

// Student actions (token required)
router.post("/register", verifyToken, registerForContest);
router.get("/me", verifyToken, getMyContestStatus);
router.get("/eligible", verifyOwner, getEligibleStudents);

export default router;
