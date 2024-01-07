import { Router } from "express";
import {
  addExam,
  deleteExam,
  getExamById,
  getExamByYear,
  getExams,
  updateExam,
} from "../controllers/exam.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.route("/").post(verifyJWT, addExam);
router.route("/").get(verifyJWT, getExams);
router.route("/:id").get(verifyJWT, getExamById);
router.route("/year/:year").get(verifyJWT, getExamByYear);
router.route("/:id").put(verifyJWT, updateExam);
router.route("/:id").delete(verifyJWT, deleteExam);

export default router;
