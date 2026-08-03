import express from "express";
import { authLimiter } from "../middleware/authMiddleware.js";
import { verifyOwner } from "../middleware/ownerAuth.js";
import { chat, listDocs, addDoc, removeDoc } from "../controllers/assistantController.js";

const router = express.Router();

// Public chatbot (throttled)
router.post("/chat", authLimiter, chat);
router.get("/chat", chat);

// Admin: manage the trained knowledge base
router.get("/docs", verifyOwner, listDocs);
router.post("/docs", verifyOwner, addDoc);
router.delete("/docs/:id", verifyOwner, removeDoc);

export default router;