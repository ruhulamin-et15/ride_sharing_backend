import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { User } from "@prisma/client";
import { sendSMS } from "../../../shared/sendSMS";
import generateOTP from "../../../helpers/generateOtp";
import config from "../../../config";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import { Request } from "express";
import redis from "../../../helpers/redis";

const userLocationKey = "user_location";
const driverLocationsKey = "driver_locations";

//send otp for login
const loginWithOTP = async (phoneNumber: string) => {
  let userInfo = await prisma.user.findUnique({
    where: { phoneNumber },
  });

  if (!userInfo) {
    userInfo = await prisma.driver.findUnique({
      where: { phoneNumber },
    });
  }
  if (!userInfo) {
    throw new ApiError(404, "User/Driver not found");
  }
  const otp = generateOTP(); // 5-digit OTP
  const OTP_EXPIRATION_TIME = 2 * 60 * 1000; // 2 minute
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME;
  const otpMessage = `Your Verification Code is ${otp}. validity only 2 minutes`;

  await sendSMS(phoneNumber, otpMessage);

  await prisma.otp.upsert({
    where: {
      phoneNumber,
    },
    update: { otpCode: otp, expiresAt: new Date(expiresAt) },
    create: { phoneNumber, otpCode: otp, expiresAt: new Date(expiresAt) },
  });

  return;
};

const verifyOTPForLogin = async (payload: {
  phoneNumber: string;
  otp: string;
}) => {
  const { phoneNumber, otp } = payload;

  let userInfo = await prisma.user.findUnique({
    where: { phoneNumber },
  });

  if (!userInfo) {
    userInfo = await prisma.driver.findUnique({
      where: { phoneNumber },
    });
  }
  if (!userInfo) {
    throw new ApiError(404, "User/Driver not found");
  }

  const userId = userInfo.id;

  const verifyData = await prisma.otp.findUnique({
    where: {
      phoneNumber,
    },
  });

  if (!verifyData) {
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  const { otpCode: savedOtp, expiresAt } = verifyData;

  if (otp !== savedOtp) {
    throw new ApiError(401, "Invalid OTP.");
  }

  if (Date.now() > expiresAt.getTime()) {
    await prisma.otp.delete({
      where: {
        phoneNumber,
      },
    }); // OTP has expired
    throw new ApiError(410, "OTP has expired. Please request a new OTP.");
  }

  // OTP is valid
  await prisma.otp.delete({
    where: {
      phoneNumber,
    },
  });

  const accessToken = jwtHelpers.generateToken(
    { id: userId, phoneNumber, role: userInfo.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return { accessToken };
};

const updateUserLocation = async (
  userId: string,
  payload: { latitude: number; longitude: number }
) => {
  const { latitude, longitude } = payload;
  if (!userId || !latitude || !longitude) {
    throw new ApiError(400, "Invalid data");
  }
  const resutll = await redis.geoadd(
    userLocationKey,
    longitude,
    latitude,
    userId
  );
  return resutll;
};

const updateDriverLocation = async (
  userId: string,
  payload: { latitude: number; longitude: number }
) => {
  const { latitude, longitude } = payload;
  if (!userId || !latitude || !longitude) {
    throw new ApiError(400, "Invalid data");
  }
  const resutll = await redis.geoadd(
    driverLocationsKey,
    longitude,
    latitude,
    userId
  );
  return resutll;
};

// get profile for logged in user
const getProfileFromDB = async (userId: string) => {
  let userInfo = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userInfo) {
    userInfo = await prisma.driver.findUnique({
      where: { id: userId },
    });
  }
  if (!userInfo) {
    throw new ApiError(404, "User/Driver not found");
  }

  return userInfo;
};

// update user profile only logged in user
const updateProfileIntoDB = async (userId: string, userData: User) => {
  let userInfo = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userInfo) {
    userInfo = await prisma.driver.findUnique({
      where: { id: userId },
    });
  }
  if (!userInfo) {
    throw new ApiError(404, "User/Driver not found");
  }
  if (userInfo.role === "DRIVER") {
    const updatedUser = await prisma.driver.update({
      where: { id: userId },
      data: userData,
    });

    return updatedUser;
  } else {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    return updatedUser;
  }
};

const myRecentSearches = async (userId: string) => {
  const recentResults = await prisma.search.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return recentResults;
};

// update profile image
const updateProfileImage = async (req: Request) => {
  const userId = req.user.id;
  let user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    user = await prisma.driver.findUnique({
      where: { id: userId },
    });
  }
  if (!user) {
    throw new ApiError(404, "User/Driver not found");
  }
  const file = req.file;
  if (!file) {
    throw new ApiError(400, "No profile image provided");
  }

  const profileImage = `${config.backend_base_url}/uploads/${file.filename}`;

  if (user.role === "DRIVER") {
    await prisma.driver.update({
      where: { id: userId },
      data: { profileImage },
    });
    return profileImage;
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage },
    });
    return profileImage;
  }
};

export const authService = {
  updateUserLocation,
  updateDriverLocation,
  loginWithOTP,
  verifyOTPForLogin,
  getProfileFromDB,
  updateProfileIntoDB,
  myRecentSearches,
  updateProfileImage,
};
