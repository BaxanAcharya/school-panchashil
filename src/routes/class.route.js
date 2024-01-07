import { Router } from "express";
import {
  addClass,
  getAllClasses,
  getClassById,
  updateClass,
} from "../controllers/class.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.route("/").post(verifyJWT, addClass);
router.route("/").get(verifyJWT, getAllClasses);
router.route("/:id").put(verifyJWT, updateClass);
router.route("/:id").get(verifyJWT, getClassById);
export default router;
