import { Router } from "express";
import { addAdmin } from "../controllers/admin.controller.js";
import { upload } from "../middleware/multer.middler.js";
const router = Router();
router.route("/register").post(upload.single("thumbnail"), addAdmin);
export default router;
