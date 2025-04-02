import express from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoute } from "../modules/auth/auth.routes";
import { bookingRoute } from "../modules/booking/booking.routes";
import { paymentRoute } from "../modules/payment/payment.routes";
import { reviewRoute } from "../modules/review/review.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },

  {
    path: "/auth",
    route: authRoute,
  },

  {
    path: "/booking",
    route: bookingRoute,
  },
  {
    path: "/payment",
    route: paymentRoute,
  },
  {
    path: "/review",
    route: reviewRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
