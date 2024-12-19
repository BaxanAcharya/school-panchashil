import { Router } from "express";
import {
  addSubject,
  deleteSubjectById,
  getSubjectById,
  getSubjects,
  updateSubjectById,
} from "../controllers/subject.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, addSubject);
router.route("/").get(verifyJWT, getSubjects);
router.route("/:id").get(verifyJWT, getSubjectById);
router.route("/:id").put(verifyJWT, updateSubjectById);
router.route("/:id").delete(verifyJWT, deleteSubjectById);
export default router;
