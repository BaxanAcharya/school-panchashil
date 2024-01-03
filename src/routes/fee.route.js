import { Router } from "express";
import {
  addFee,
  deleteFeeById,
  getFeeByClassId,
  getFeeById,
  getFees,
  updateFeeById,
} from "../controllers/fee.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, addFee);
router.route("/").get(verifyJWT, getFees);
router.route("/:id").get(verifyJWT, getFeeById);
router.route("/class/:classId").get(verifyJWT, getFeeByClassId);
router.route("/:id").put(verifyJWT, updateFeeById);
router.route("/:id").delete(verifyJWT, deleteFeeById);
export default router;
