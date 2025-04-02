import express from "express";
import { authController } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import { authValidation } from "./auth.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";

const router = express.Router();

router.post("/login/send-otp", authController.loginWithOTP);
router.post("/login/verify-otp", authController.verifyOTPForLogin);
router.get("/profile", auth(), authController.getProfile);
router.post(
  "/update/user-location",
  auth(UserRole.USER),
  authController.updateUserLocation
);
router.post(
  "/update/driver-location",
  auth(UserRole.DRIVER),
  authController.updateDriverLocation
);
router.patch(
  "/profile",
  validateRequest(authValidation.updateProfileSchema),
  auth(),
  authController.updateProfile
);
router.get(
  "/recent-searches",
  auth(UserRole.USER),
  authController.myRecentSearches
);
router.patch(
  "/update/profile-image",
  auth(),
  fileUploader.profileImage,
  authController.updateProfileImage
);

export const authRoute = router;
