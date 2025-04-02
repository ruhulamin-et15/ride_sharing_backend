import { User } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import { ObjectId } from "mongodb";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import generateOTP from "../../../helpers/generateOtp";
import { sendSMS } from "../../../shared/sendSMS";

// send otp
const registrationWithOTP = async (payload: User) => {
  const otp = generateOTP(); // 5-digit OTP
  const OTP_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minute
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME;

  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber: payload.phoneNumber },
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this phone number");
  }

  const existingDriver = await prisma.driver.findUnique({
    where: { phoneNumber: payload.phoneNumber },
  });

  if (existingDriver) {
    throw new ApiError(409, "Driver already exists with this phone number");
  }

  await prisma.otp.upsert({
    where: {
      phoneNumber: payload.phoneNumber,
    },
    update: { otpCode: otp, expiresAt: new Date(expiresAt) },
    create: {
      ...payload,
      otpCode: otp,
      expiresAt: new Date(expiresAt),
    },
  });
  const otpMessage = `Registration OTP Code is ${otp}. validity only 2 minutes`;

  await sendSMS(payload.phoneNumber, otpMessage);
  return;
};

//create user
const otpVerifyForRegistration = async (payload: {
  phoneNumber: string;
  otpCode: string;
}) => {
  const existData = await prisma.otp.findUnique({
    where: { phoneNumber: payload.phoneNumber, otpCode: payload.otpCode },
  });

  if (!existData) {
    throw new ApiError(404, "OTP is invalid");
  }

  if (Date.now() > existData.expiresAt.getTime()) {
    throw new ApiError(410, "OTP has expired. Please request a new OTP.");
  }

  let existingUser;

  existingUser = await prisma.user.findUnique({
    where: { phoneNumber: existData.phoneNumber },
  });

  existingUser = await prisma.driver.findUnique({
    where: { phoneNumber: existData.phoneNumber },
  });

  if (existingUser) {
    throw new ApiError(409, "Account already exists");
  }

  const user = await prisma.$transaction(async (prisma) => {
    await prisma.otp.delete({
      where: {
        phoneNumber: payload.phoneNumber,
      },
    });

    if (existData.role === "USER") {
      return await prisma.user.create({
        data: {
          phoneNumber: payload.phoneNumber,
          fullName: existData?.fullName || "",
          gender: existData?.gender || "OTHER",
          role: "USER",
        },
      });
    } else {
      return await prisma.driver.create({
        data: {
          phoneNumber: payload.phoneNumber,
          fullName: existData?.fullName || "",
          gender: existData?.gender || "OTHER",
          role: "DRIVER",
        },
      });
    }
  });

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, phoneNumber: user.phoneNumber, role: user.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return { accessToken };
};

//get single user
const getSingleUserIntoDB = async (id: string) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user ID format");
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }
  return user;
};

//get all users
const getUsersIntoDB = async () => {
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    throw new ApiError(404, "Users not found!");
  }
  return users;
};

//update user
const updateUserIntoDB = async (id: string, userData: any) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user ID format");
  }
  const existingUser = await getSingleUserIntoDB(id);
  if (!existingUser) {
    throw new ApiError(404, "user not found for edit user");
  }
  const updatedUser = await prisma.user.update({
    where: { id },
    data: userData,
  });

  return updatedUser;
};

//delete user
const deleteUserIntoDB = async (userId: string, loggedId: string) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  if (userId === loggedId) {
    throw new ApiError(403, "You can't delete your own account!");
  }
  const existingUser = await getSingleUserIntoDB(userId);
  if (!existingUser) {
    throw new ApiError(404, "user not found for delete this");
  }
  await prisma.user.delete({
    where: { id: userId },
  });
  return;
};

export const userService = {
  registrationWithOTP,
  otpVerifyForRegistration,
  getUsersIntoDB,
  getSingleUserIntoDB,
  updateUserIntoDB,
  deleteUserIntoDB,
};
