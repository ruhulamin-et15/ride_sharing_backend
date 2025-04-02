import { Request } from "express";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../shared/pagination";
import { ObjectId } from "mongodb";
import { BookingStatus } from "@prisma/client";
import redis from "../../../helpers/redis";

const driverLocationsKey = "driver_locations";

// ******************************************* User Part **********************************************

const getNearbyActiveDriver = async (
  radius: number,
  latitude: number,
  longitude: number
) => {
  const nearbyDrivers = await redis.georadius(
    driverLocationsKey,
    longitude,
    latitude,
    radius,
    "km",
    "WITHDIST",
    "WITHCOORD"
  );
  return (nearbyDrivers as [string, string, [string, string]][]).map(
    ([userId, distance, [longitude, latitude]]) => ({
      userId,
      latitude: latitude,
      longitude: longitude,
      distance: distance,
    })
  );
};

const getSingleDriverFromDB = async (driverId: string) => {
  if (!ObjectId.isValid(driverId)) {
    throw new ApiError(400, "Invalid driver ID format");
  }
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
  });
  if (!driver) {
    throw new ApiError(404, "Driver not found!");
  }
  return driver;
};

const createBookingInDB = async (
  payload: any,
  driverId: string,
  userId: string
) => {
  const booking = await prisma.booking.create({
    data: { ...payload, driverId, userId },
  });
  return booking;
};

const bookAgainInDB = async (bookingId: string) => {
  const bookingInfo: any = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!bookingInfo) {
    throw new ApiError(404, "Booking not found");
  }

  if (bookingInfo.status === "COMPLETED") {
    const booking = await prisma.booking.create({
      data: {
        userId: bookingInfo.userId,
        driverId: bookingInfo.driverId,
        pickupLocation: bookingInfo.pickupLocation || "",
        destination: bookingInfo.destination || "",
        pickupDate: bookingInfo.pickupDate,
        pickupTime: bookingInfo.pickupTime,
        distance: bookingInfo.distance,
        personNo: bookingInfo.personNo,
        estimatedCost: bookingInfo.estimatedCost,
      },
    });
    return booking;
  } else {
    throw new ApiError(400, "Booking is not completed");
  }
};

const userWaitingBookings = async (req: Request) => {
  const userId = req.user.id;

  const booking = await prisma.booking.findFirst({
    where: {
      userId: userId,
      status: "WAITING",
    },
    include: {
      driver: true,
      user: true,
    },
  });
  if (!booking) {
    throw new ApiError(404, "No waiting booking found");
  }

  return booking;
};

const userProgressBookings = async (req: Request) => {
  const userId = req.user.id;

  const booking = await prisma.booking.findFirst({
    where: {
      userId,
      status: "IN_PROGRESS",
    },
    include: {
      driver: true,
      user: true,
    },
  });

  if (!booking) {
    throw new ApiError(404, "No progress booking found");
  }

  return booking;
};

const userPastBookings = async (req: Request) => {
  const userId = req.user.id;
  const { skip, take, limit, page } = paginationHelper(req.query as any);

  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: {
      driver: true,
      user: true,
    },
  });

  const totalCount = await prisma.booking.count({
    where: {
      userId,
      status: "COMPLETED",
    },
  });
  const totalPages = Math.ceil(totalCount / limit);

  return {
    totalCount,
    totalPages,
    currentPage: page,
    bookings,
  };
};

const userCancelledBookings = async (req: Request) => {
  const userId = req.user.id;
  const { skip, take, limit, page } = paginationHelper(req.query as any);

  const bookings = await prisma.booking.findMany({
    where: {
      userId: userId,
      status: "CANCELLED",
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: {
      driver: true,
      user: true,
    },
  });

  const totalCount = await prisma.booking.count({
    where: {
      userId,
      status: "CANCELLED",
    },
  });
  const totalPages = Math.ceil(totalCount / limit);

  return {
    totalCount,
    totalPages,
    currentPage: page,
    bookings,
  };
};

const getBookingByIdFromDB = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      driver: true,
      user: true,
    },
  });
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }
  return booking;
};

const createRecentSearch = async (
  latitude: number,
  longitude: number,
  userId: string
) => {
  await prisma.search.create({
    data: {
      latitude,
      longitude,
      userId,
    },
  });
  return;
};

// ******************************************* Driver Part **********************************************

const updateBookingInDB = async (bookingId: string, payload: any) => {
  const existBooking = await getBookingByIdFromDB(bookingId);
  if (!existBooking) {
    throw new ApiError(404, "Booking not found for status changed");
  }
  if (existBooking.status === payload.status) {
    throw new ApiError(400, "Booking already in progress");
  }
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: payload,
  });
  if (payload.status === "IN_PROGRESS") {
    await prisma.booking.updateMany({
      where: {
        NOT: { id: bookingId },
      },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });
  }
  return booking;
};

const driverWaitingBookings = async (req: Request) => {
  const driverId = req.user.id;
  const { skip, take, limit, page } = paginationHelper(req.query as any);

  const bookings = await prisma.booking.findMany({
    where: {
      driverId,
      status: "WAITING",
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: {
      driver: true,
      user: true,
    },
  });

  const totalCount = await prisma.booking.count({
    where: {
      driverId,
      status: "WAITING",
    },
  });
  const totalPages = Math.ceil(totalCount / limit);

  return {
    totalCount,
    totalPages,
    currentPage: page,
    bookings,
  };
};

const driverProgressBookings = async (req: Request) => {
  const driverId = req.user.id;

  const booking = await prisma.booking.findFirst({
    where: {
      driverId,
      status: "IN_PROGRESS",
    },
    include: {
      driver: true,
      user: true,
    },
  });

  if (!booking) {
    throw new ApiError(404, "No progress booking found");
  }

  return booking;
};

const driverPastBookings = async (req: Request) => {
  const driverId = req.user.id;
  const { skip, take, limit, page } = paginationHelper(req.query as any);

  const bookings = await prisma.booking.findMany({
    where: {
      driverId,
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: {
      driver: true,
      user: true,
    },
  });

  const totalCount = await prisma.booking.count({
    where: {
      driverId,
      status: "COMPLETED",
    },
  });
  const totalPages = Math.ceil(totalCount / limit);

  return {
    totalCount,
    totalPages,
    currentPage: page,
    bookings,
  };
};

const allBookingsFromDB = async (req: Request) => {
  const { skip, take, limit, page } = paginationHelper(req.query as any);

  const bookings = await prisma.booking.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      driver: true,
      user: true,
    },
  });

  const totalCount = await prisma.booking.count();
  const totalPages = Math.ceil(totalCount / limit);
  return {
    totalCount,
    totalPages,
    currentPage: page,
    bookings,
  };
};

export const bookingServices = {
  getNearbyActiveDriver,
  getSingleDriverFromDB,
  createBookingInDB,
  bookAgainInDB,
  userWaitingBookings,
  driverWaitingBookings,
  driverProgressBookings,
  userProgressBookings,
  userPastBookings,
  driverPastBookings,
  userCancelledBookings,
  getBookingByIdFromDB,
  allBookingsFromDB,
  updateBookingInDB,
  createRecentSearch,
};
