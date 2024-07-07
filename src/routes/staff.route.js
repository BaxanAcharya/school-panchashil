import { Router } from "express";
import {
  addStaff,
  getStaffById,
  getStaffs,
  makeStaffLeave,
  updateStaff,
} from "../controllers/staff.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

router.route("/").post(verifyJWT, addStaff);
router.route("/").get(verifyJWT, getStaffs);
router.route("/:id").get(verifyJWT, getStaffById);
router.route("/:id").put(verifyJWT, updateStaff);
router.route("/:id/leave").put(verifyJWT, makeStaffLeave);
export default router;
