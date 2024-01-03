import { Router } from "express";
import {
  addResult,
  deleteResult,
  getResultById,
  getResults,
  updateResult,
} from "../controllers/result.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, addResult);
router.route("/").get(verifyJWT, getResults);
router.route("/:id").get(verifyJWT, getResultById);
router.route("/:id").delete(verifyJWT, deleteResult);
router.route("/:id").put(verifyJWT, updateResult);
export default router;
