import { Router } from "express";
import {
  addSubject,
  deleteSubjectById,
  getSubjectByClassId,
  getSubjectById,
  getSubjects,
  tooggleSubjectById,
  updateSubjectById,
} from "../controllers/subject.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, addSubject);
router.route("/").get(verifyJWT, getSubjects);
router.route("/:id").get(verifyJWT, getSubjectById);
router.route("/class/:classId").get(verifyJWT, getSubjectByClassId);
router.route("/:id").put(verifyJWT, updateSubjectById);
router.route("/:id").delete(verifyJWT, deleteSubjectById);
router.route("/toggle/:id").put(verifyJWT, tooggleSubjectById);
export default router;
