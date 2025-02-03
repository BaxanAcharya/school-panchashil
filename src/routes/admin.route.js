import { Router } from "express";
import {
  addAdmin,
  currentAdmin,
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  updateAdmin,
  updateCurrentPassword,
  updateThumbNail,
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../utils/bucket.js";
// import { upload } from "../middleware/multer.middleware.js";
const router = Router();
router.route("/register").post(upload.single("thumbnail"), addAdmin);
router.route("/login").post(loginAdmin);
router.route("/logout").post(verifyJWT, logoutAdmin);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/update-password").put(verifyJWT, updateCurrentPassword);
router.route("/me").get(verifyJWT, currentAdmin);
router.route("/").put(verifyJWT, updateAdmin);
router
  .route("/thumbnail")
  .put(verifyJWT, upload.single("thumbnail"), updateThumbNail);
export default router;
