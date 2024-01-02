import { Router } from "express";
import {
  addAdmin,
  loginAdmin,
  logoutUser,
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
const router = Router();
router.route("/register").post(upload.single("thumbnail"), addAdmin);
router.route("/login").post(loginAdmin);
router.route("/logout").post(verifyJWT, logoutUser);
export default router;
