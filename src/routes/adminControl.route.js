import { Router } from "express";
import {
  addAdminControl,
  getAdminControl,
} from "../controllers/adminControl.controller.js";
const router = Router();

router.route("/").post(addAdminControl);
router.route("/").get(getAdminControl);

export default router;
