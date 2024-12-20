import { Router } from "express";
import {
  addSalarySheet,
  addSalarySheetBulk,
  deleteSalarySheet,
  getSalarySheetById,
  getSalarySheets,
  updateSalarySheet,
} from "../controllers/salary.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").get(verifyJWT, getSalarySheets);
router.route("/").post(verifyJWT, addSalarySheet);
router.route("/:id").get(verifyJWT, getSalarySheetById);
router.route("/:id").put(verifyJWT, updateSalarySheet);
router.route("/:id").delete(verifyJWT, deleteSalarySheet);
router.route("/bulk").post(verifyJWT, addSalarySheetBulk);

export default router;
