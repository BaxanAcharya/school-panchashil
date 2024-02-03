import { Router } from "express";
import {
  addTransportationFee,
  deleteTransportationFee,
  getTransportationFee,
  getTransportationFees,
  updateTransportationFee,
} from "../controllers/transportationFee.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.route("/").post(verifyJWT, addTransportationFee);
router.route("/").get(verifyJWT, getTransportationFees);
router.route("/:id").get(verifyJWT, getTransportationFee);
router.route("/:id").put(verifyJWT, updateTransportationFee);
router.route("/:id").delete(verifyJWT, deleteTransportationFee);
export default router;
