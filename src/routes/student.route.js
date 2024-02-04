import { Router } from "express";
import {
  addStudent,
  deleteStudentById,
  getLeftStudents,
  getStudentByClass,
  getStudentById,
  getStudents,
  makeStudentLeave,
  updateStudentById,
} from "../controllers/student.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.route("/").post(verifyJWT, addStudent);
router.route("/").get(verifyJWT, getStudents);
router.route("/left").get(verifyJWT, getLeftStudents);
router.route("/:id").delete(verifyJWT, deleteStudentById);
router.route("/:id").put(verifyJWT, updateStudentById);
router.route("/:id").get(verifyJWT, getStudentById);
router.route("/leave/:id").put(verifyJWT, makeStudentLeave);
router.route("/class/:classId").get(verifyJWT, getStudentByClass);
export default router;
