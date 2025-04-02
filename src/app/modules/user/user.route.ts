import express from "express";
import { UserControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/registration/send-otp", UserControllers.registrationWithOTP);
router.post("/registration", UserControllers.otpVerifyForRegistration);
router.get("/", auth(UserRole.ADMIN), UserControllers.getUsers);
router.get("/:id", auth(), UserControllers.getSingleUser);
router.put(
  "/:id",
  validateRequest(userValidation.userUpdateValidationSchema),
  auth(UserRole.ADMIN),
  UserControllers.updateUser
);
router.delete("/:id", auth(UserRole.ADMIN), UserControllers.deleteUser);

export const userRoutes = router;
