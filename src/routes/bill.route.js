import { Router } from "express";
import {
  addBill,
  deleteBill,
  getBill,
  getBills,
  printBill,
  studentBillOfYearAndMonth,
  updateBill,
} from "../controllers/bill.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router
  .route("/:student/:year/:month")
  .get(verifyJWT, studentBillOfYearAndMonth);
router.route("/").post(verifyJWT, addBill);
// router.route("/bulk/:year/:month").post(verifyJWT, addBulkBill);
router.route("/").get(verifyJWT, getBills);
router.route("/:id").get(verifyJWT, getBill);
router.route("/:id").delete(verifyJWT, deleteBill);
router.route("/:id").put(verifyJWT, updateBill);
router.route("/:id/print").post(verifyJWT, printBill);
// router.route("/:year/:month/student").get(verifyJWT, getBillsOfStudentIn);

export default router;
