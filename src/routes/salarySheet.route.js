import { Router } from "express";
import { addSalarySheet } from "../controllers/salary.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").get((_, res) => {});
router.route("/").post(verifyJWT, addSalarySheet);

export default router;
