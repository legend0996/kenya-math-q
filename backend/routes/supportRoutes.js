import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { sendMessage, getMessages } from "../controllers/supportController.js";

const router = express.Router();

// Students/schools interact via their login token; admins use /api/owner/support
router.get("/messages", verifyToken, getMessages);
router.post("/messages", verifyToken, sendMessage);

export default router;