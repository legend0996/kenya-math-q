import express from "express";
import {
  getSchoolStudents,
  addStudentBySchool,
} from "../controllers/schoolController.js";

const router = express.Router();

router.get("/students", getSchoolStudents);
router.post("/add-student", addStudentBySchool);

export default router;
