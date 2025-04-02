import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { bookingControllers } from "./booking.controller";

const router = express.Router();

router.post(
  "/find-driver",
  auth(UserRole.USER),
  bookingControllers.getNearbyActiveDriver
);
router.get(
  "/single-driver/:driverId",
  auth(UserRole.USER, UserRole.ADMIN),
  bookingControllers.singleDriver
);
router.post(
  "/create/:driverId",
  auth(UserRole.USER),
  bookingControllers.createBooking
);
router.post(
  "/again-booking/:bookingId",
  auth(UserRole.USER),
  bookingControllers.bookingAgain
);
router.get(
  "/user-waiting/bookings",
  auth(UserRole.USER),
  bookingControllers.userWaitingBookings
);
router.post(
  "/create-recent-search",
  auth(UserRole.USER),
  bookingControllers.createRecentSearch
);
router.get(
  "/user-progress/bookings",
  auth(UserRole.USER),
  bookingControllers.userProgressBookings
);
router.get(
  "/user-past/bookings",
  auth(UserRole.USER),
  bookingControllers.userPastBookings
);
router.get(
  "/user-cancelled/bookings",
  auth(UserRole.USER),
  bookingControllers.userCancelledBookings
);
router.get(
  "/driver-waiting/bookings",
  auth(UserRole.DRIVER),
  bookingControllers.driverWaitingBookings
);
router.get(
  "/driver-progress/bookings",
  auth(UserRole.DRIVER),
  bookingControllers.driverProgressBookings
);
router.get(
  "/driver-past/bookings",
  auth(UserRole.DRIVER),
  bookingControllers.driverPastBookings
);
router.patch(
  "/booking-status/:bookingId",
  auth(UserRole.DRIVER),
  bookingControllers.updateBooking
);
router.get(
  "/single-booking/:bookingId",
  auth(),
  bookingControllers.getSingleBooking
);
router.get("/bookings", auth(), bookingControllers.allBookings);

export const bookingRoute = router;
