import { Router } from "express";
import { addAdmin } from "../controllers/admin.controller.js";
const router = Router();
router.route("/register").post(addAdmin);
export default router;
