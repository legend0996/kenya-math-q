import {
  getQuestions,
  submitAnswers,
  releaseResults,
  getMyResults,
  generateCertificates,
  downloadCertificate,
} from "../controllers/examController.js";

router.get("/:contest_id", getQuestions);
router.post("/submit", submitAnswers);
router.post("/generate-certificates", generateCertificates);
router.get("/certificate", downloadCertificate);
// 🔥 NEW
router.post("/release", releaseResults);
router.get("/result", getMyResults);
