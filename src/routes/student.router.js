import { Router } from "express";
import {
  addStudent,
  deleteStudentById,
  getStudentById,
  getStudents,
  updateStudentById,
} from "../controllers/student.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.route("/").post(verifyJWT, addStudent);
router.route("/").get(verifyJWT, getStudents);
router.route("/:id").delete(verifyJWT, deleteStudentById);
router.route("/:id").put(verifyJWT, updateStudentById);
router.route("/:id").get(verifyJWT, getStudentById);
export default router;
