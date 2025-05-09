import { Router } from "express";
import {
  addStudent,
  deleteStudentById,
  getLeftStudents,
  getStudentByClass,
  getStudentById,
  getStudents,
  makeStudentLeave,
  makeStudentUnLeave,
  updateStudentById,
} from "../controllers/student.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../utils/bucket.js";

const router = Router();
router.route("/").post(verifyJWT, upload.single("image"), addStudent);
router.route("/").get(verifyJWT, getStudents);
router.route("/left").get(verifyJWT, getLeftStudents);
router.route("/:id").delete(verifyJWT, deleteStudentById);
router.route("/:id").put(verifyJWT, upload.single("image"), updateStudentById);
router.route("/:id").get(verifyJWT, getStudentById);
router.route("/leave/:id").put(verifyJWT, makeStudentLeave);
router.route("/unleave/:id").put(verifyJWT, makeStudentUnLeave);
router.route("/class/:classId").get(verifyJWT, getStudentByClass);
export default router;
