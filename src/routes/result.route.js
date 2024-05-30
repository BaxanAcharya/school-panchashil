import { Router } from "express";
import {
  addResult,
  addResultBulk,
  deleteResult,
  generateLedger,
  getResultById,
  getResults,
  getResultsOfStudentIn,
  printMarkSheet,
  updateResult,
} from "../controllers/result.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, addResult);
router.route("/bulk/:examId").post(verifyJWT, addResultBulk);
router.route("/").get(verifyJWT, getResults);
router.route("/:id").get(verifyJWT, getResultById);
router.route("/:id").delete(verifyJWT, deleteResult);
router.route("/:id").put(verifyJWT, updateResult);
router.route("/:id/print").post(verifyJWT, printMarkSheet);
router.route("/:examId/:classId/ledger").post(verifyJWT, generateLedger);
router.route("/:examId/student").get(verifyJWT, getResultsOfStudentIn);
export default router;
