import { Router } from "express";
import {
  addBill,
  deleteBill,
  getBill,
  getBills,
  getBillsOfStudent,
  printBill,
  updateBill,
} from "../controllers/bill.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.route("/").post(verifyJWT, addBill);
router.route("/").get(verifyJWT, getBills);
router.route("/:id").get(verifyJWT, getBill);
router.route("/:id").delete(verifyJWT, deleteBill);
router.route("/:id").put(verifyJWT, updateBill);
router.route("/student/:id").get(verifyJWT, getBillsOfStudent);
router.route("/:id/print").post(verifyJWT, printBill);

export default router;
