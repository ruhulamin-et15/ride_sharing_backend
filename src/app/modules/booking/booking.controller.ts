import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { bookingServices } from "./booking.service";

// *******************************************User Part **********************************************
const getNearbyActiveDriver = catchAsync(async (req, res) => {
  const { latitude, longitude, radius } = req.body;
  const userLocation = await bookingServices.getNearbyActiveDriver(
    radius,
    latitude,
    longitude
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Driver location retrieved successfully",
    data: userLocation,
  });
});

const singleDriver = catchAsync(async (req, res) => {
  const { driverId } = req.params;
  const driver = await bookingServices.getSingleDriverFromDB(driverId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "driver retrieved successfully",
    data: driver,
  });
});

const createBooking = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { driverId } = req.params;
  const result = await bookingServices.createBookingInDB(
    req.body,
    driverId,
    userId
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Booking created successfully",
    data: result,
  });
});

const bookingAgain = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const result = await bookingServices.bookAgainInDB(bookingId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Again this Booking created successfully",
    data: result,
  });
});

const userWaitingBookings = catchAsync(async (req, res) => {
  const bookings = await bookingServices.userWaitingBookings(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Waiting Bookings retrieved successfully",
    data: bookings,
  });
});

const userProgressBookings = catchAsync(async (req, res) => {
  const bookings = await bookingServices.userProgressBookings(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Progress Bookings retrieved successfully",
    data: bookings,
  });
});

const userPastBookings = catchAsync(async (req, res) => {
  const bookings = await bookingServices.userPastBookings(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Past Bookings retrieved successfully",
    data: bookings,
  });
});

const userCancelledBookings = catchAsync(async (req, res) => {
  const bookings = await bookingServices.userCancelledBookings(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cancelled Bookings retrieved successfully",
    data: bookings,
  });
});

const getSingleBooking = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const booking = await bookingServices.getBookingByIdFromDB(bookingId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking retrieved successfully",
    data: booking,
  });
});

const createRecentSearch = catchAsync(async (req, res) => {
  const { lat, long } = req.body;
  await bookingServices.createRecentSearch(lat, long, req.user.id);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Recent search created successfully",
  });
});

// ******************************************* Driver Part **********************************************

const updateBooking = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const updatedBooking = await bookingServices.updateBookingInDB(
    bookingId,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking updated successfully",
    data: updatedBooking,
  });
});

const driverWaitingBookings = catchAsync(async (req, res) => {
  const bookings = await bookingServices.driverWaitingBookings(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Waiting Bookings retrieved successfully",
    data: bookings,
  });
});

const driverProgressBookings = catchAsync(async (req, res) => {
  const bookings = await bookingServices.driverProgressBookings(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Progress Bookings retrieved successfully",
    data: bookings,
  });
});

const driverPastBookings = catchAsync(async (req, res) => {
  const bookings = await bookingServices.driverPastBookings(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Past Bookings retrieved successfully",
    data: bookings,
  });
});

const allBookings = catchAsync(async (req, res) => {
  const bookings = await bookingServices.allBookingsFromDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All bookings retrieved successfully",
    data: bookings,
  });
});

export const bookingControllers = {
  getNearbyActiveDriver,
  singleDriver,
  createBooking,
  bookingAgain,
  userWaitingBookings,
  userProgressBookings,
  driverProgressBookings,
  userPastBookings,
  driverPastBookings,
  userCancelledBookings,
  getSingleBooking,
  allBookings,
  updateBooking,
  createRecentSearch,
  driverWaitingBookings,
};
