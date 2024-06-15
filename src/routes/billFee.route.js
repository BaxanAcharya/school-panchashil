import { Router } from "express";
import {
  addBillFee,
  deleteBillFee,
  getBillFee,
  getBillFees,
  updateBillFee,
} from "../controllers/billFee.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

router.post("/", verifyJWT, addBillFee);
router.get("/", verifyJWT, getBillFees);
router.get("/:id", verifyJWT, getBillFee);
router.delete("/:id", verifyJWT, deleteBillFee);
router.put("/:id", verifyJWT, updateBillFee);
export default router;
