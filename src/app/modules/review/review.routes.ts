import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { reviewControllers } from "./review.controller";

const router = express.Router();

router.post("/create/:bookingId", auth(UserRole.USER), reviewControllers.createReview);

export const reviewRoute = router;
