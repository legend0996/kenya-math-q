import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { MATERIALS_DIR, uploadMaterialFile } from "../controllers/contentController.js";
import { loginLimiter } from "../middleware/authMiddleware.js";
import { verifyOwner, requirePermission } from "../middleware/ownerAuth.js";
import {
  loginOwner,
  getOwnerStats,
  getPendingSchools,
  updateSchoolStatus,
  createContest,
  setEntryFee,
  getAllContests,
  activateContest,
  setRegistrationWindow,
  getRegistrations,
  markPayment,
  createQuestion,
  getContestPapers,
  saveContestPapers,
  getQuestionsByContest,
  updateQuestion,
  deleteQuestion,
  releaseContestResults,
  getContestParticipants,
  exportContestResults,
  getOwners,
  addAdmin,
  updateAdminPermissions,
  removeAdmin,
  getStudents,
  setStudentAdmin,
  revokeStudentAdmin,
  getAllStudentsDetailed,
  registerStudents,
  markStudentsPaid,
  setContestGradeSchedule,
  resetStudentResults,
} from "../controllers/owner.controller.js";
import {
  getMarkableContests,
  getSubmissions,
  getMarking,
  saveMarking,
  setMarkingMode,
  releaseResults,
  hideResults,
  autoMarkGrade,
} from "../controllers/markingController.js";
import {
  createTestContest,
  startTestContest,
  stopTestContest,
  listTestContests,
  getTestQuestions,
} from "../controllers/testContestController.js";
import {
  getMessages,
  adminReply,
  getConversations,
  getConversationMessages,
  markConversationRead,
} from "../controllers/supportController.js";
import {
  getContestInstructions,
  saveContestInstructions,
  deleteContestInstructions,
  listMaterials,
  saveMaterial,
  deleteMaterial,
} from "../controllers/contentController.js";
import { listParents } from "../controllers/parentController.js";

const router = express.Router();

// File upload for revision materials (PDFs, images, docs)
fs.mkdirSync(MATERIALS_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, MATERIALS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").slice(0, 10);
      cb(null, `mat-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post("/login", loginLimiter, loginOwner);

// 🔒 PROTECTED ROUTES
router.get("/stats", verifyOwner, getOwnerStats);

router.get("/schools/pending", verifyOwner, requirePermission("manage_schools"), getPendingSchools);
router.post("/schools/update", verifyOwner, requirePermission("manage_schools"), updateSchoolStatus);

router.post("/contest/create", verifyOwner, createContest);
router.post("/contest/fee", verifyOwner, setEntryFee);
router.get("/contest/all", verifyOwner, getAllContests);
router.post("/contest/activate", verifyOwner, activateContest);
router.post("/contest/window", verifyOwner, setRegistrationWindow);

router.get("/contest/papers/:contest_id", verifyOwner, getContestPapers);
router.post("/contest/papers", verifyOwner, saveContestPapers);
router.post("/contest/:contest_id/release-results", verifyOwner, requirePermission("manage_results"), releaseContestResults);
router.get("/contest/:contest_id/participants", verifyOwner, getContestParticipants);
router.get("/contest/:contest_id/export", verifyOwner, requirePermission("manage_results"), exportContestResults);

router.post("/question/create", verifyOwner, requirePermission("manage_questions"), createQuestion);
router.get("/question/contest/:contest_id", verifyOwner, requirePermission("manage_questions"), getQuestionsByContest);
router.post("/question/:question_id/update", verifyOwner, requirePermission("manage_questions"), updateQuestion);
router.delete("/question/:question_id", verifyOwner, requirePermission("manage_questions"), deleteQuestion);

// 📄 CONTEST INSTRUCTIONS (compulsory, per grade — add/edit/delete anytime)
router.get("/instructions/:contest_id", verifyOwner, getContestInstructions);
router.post("/instructions", verifyOwner, saveContestInstructions);
router.delete("/instructions/:contest_id/:grade", verifyOwner, deleteContestInstructions);

// 📚 REVISION / STUDY MATERIALS (per grade)
router.get("/materials", verifyOwner, listMaterials);
router.post("/materials", verifyOwner, saveMaterial);
router.post("/materials/:id", verifyOwner, saveMaterial);
router.delete("/materials/:id", verifyOwner, deleteMaterial);
router.post("/materials/upload", verifyOwner, requirePermission("manage_questions"), upload.single("file"), uploadMaterialFile);

// 🧪 TEST CONTESTS (admin start/stop instantly)
router.post("/test/create", verifyOwner, createTestContest);
router.post("/test/start", verifyOwner, startTestContest);
router.post("/test/stop", verifyOwner, stopTestContest);
router.get("/test/list", verifyOwner, listTestContests);
router.get("/test/:contest_id/questions", verifyOwner, getTestQuestions);

router.get("/registrations", verifyOwner, getRegistrations);
router.post("/payment/mark", verifyOwner, markPayment);
router.get("/students/table", verifyOwner, requirePermission("manage_contests"), getAllStudentsDetailed);
router.post("/students/register", verifyOwner, requirePermission("manage_contests"), registerStudents);
router.post("/students/mark-paid", verifyOwner, requirePermission("manage_contests"), markStudentsPaid);
router.post("/contest/grade-schedule", verifyOwner, requirePermission("manage_contests"), setContestGradeSchedule);
router.post("/result/reset", verifyOwner, requirePermission("manage_results"), resetStudentResults);

// 👥 MULTI-ADMIN
router.get("/admin/list", verifyOwner, getOwners);
router.post("/admin/add", verifyOwner, addAdmin);
router.post("/admin/permissions", verifyOwner, updateAdminPermissions);
router.delete("/admin/:owner_id/remove", verifyOwner, removeAdmin);

// 👤 CURRENT ADMIN PROFILE (used to gate which dashboard sidebars/tabs render)
router.get("/me", verifyOwner, (req, res) => res.json({ success: true, owner: req.owner }));

// 👨‍👩‍👧 ALL PARENTS WITH THEIR CHILDREN
router.get("/parents", verifyOwner, listParents);

// 👩‍🎓 PROMOTE REGISTERED STUDENTS TO ADMIN
router.get("/students", verifyOwner, getStudents);
router.post("/students/promote", verifyOwner, setStudentAdmin);
router.post("/students/revoke", verifyOwner, revokeStudentAdmin);

// 📝 MARKING (manual per-question marks + auto percentage)
router.get("/marking/contests", verifyOwner, getMarkableContests);
router.get("/marking/:contest_id/submissions", verifyOwner, getSubmissions);
router.get("/marking/:contest_id/student/:student_id", verifyOwner, getMarking);
router.post("/marking/save", verifyOwner, saveMarking);
router.post("/marking/mode", verifyOwner, setMarkingMode);
router.post("/marking/release", verifyOwner, releaseResults);
router.post("/marking/hide", verifyOwner, hideResults);
router.post("/marking/auto-grade", verifyOwner, autoMarkGrade);

// 💬 SUPPORT (admin side — needs reply_support permission)
router.get("/support/messages", verifyOwner, requirePermission("reply_support"), getMessages);
router.post("/support/reply", verifyOwner, requirePermission("reply_support"), adminReply);
router.get("/support/conversations", verifyOwner, requirePermission("reply_support"), getConversations);
router.get("/support/conversations/:role/:id", verifyOwner, requirePermission("reply_support"), getConversationMessages);
router.post("/support/conversations/:role/:id/read", verifyOwner, requirePermission("reply_support"), markConversationRead);

export default router;