import { Router } from "express";
import {
  addTransportationArea,
  deleteArea,
  getAreaById,
  getAreas,
  updateArea,
} from "../controllers/transportationArea.controller";
import { verifyJWT } from "../middleware/auth.middleware";

const router = Router();
router.route("/").post(verifyJWT, addTransportationArea);
router.route("/").get(verifyJWT, getAreas);
router.route("/:id").get(verifyJWT, getAreaById);
router.route("/:id").put(verifyJWT, updateArea);
router.route("/:id").delete(verifyJWT, deleteArea);
export default router;
