import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { authService } from "./auth.service";
import sendResponse from "../../../shared/sendResponse";

//login user
const loginWithOTP = catchAsync(async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  await authService.loginWithOTP(phoneNumber);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP Send Successfully",
  });
});

// verify otp code
const verifyOTPForLogin = catchAsync(async (req, res) => {
  const payload = req.body;
  const response = await authService.verifyOTPForLogin(payload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP verified successfully.",
    data: response,
  });
});

//update user location
const updateUserLocation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const updatedUserLocation = await authService.updateUserLocation(
    userId,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User location added successfully",
    data: updatedUserLocation,
  });
});

//update driver location
const updateDriverLocation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const updatedDriverLocation = await authService.updateDriverLocation(
    userId,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Driver location added successfully",
    data: updatedDriverLocation,
  });
});

// get profile for logged in user
const getProfile = catchAsync(async (req: any, res: Response) => {
  const { id } = req.user;
  const user = await authService.getProfileFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile retrieved successfully",
    data: user,
  });
});

// update user profile only logged in user
const updateProfile = catchAsync(async (req: any, res: Response) => {
  const { id } = req.user;
  const updatedUser = await authService.updateProfileIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile updated successfully",
    data: updatedUser,
  });
});

const myRecentSearches = catchAsync(async (req, res) => {
  const { id } = req.user;
  const recentSearch = await authService.myRecentSearches(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Recent search retrieved successfully",
    data: recentSearch,
  });
});

const updateProfileImage = catchAsync(async (req: any, res: Response) => {
  const updatedUser = await authService.updateProfileImage(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile image updated successfully",
    data: updatedUser,
  });
});

export const authController = {
  loginWithOTP,
  verifyOTPForLogin,
  getProfile,
  updateProfile,
  updateUserLocation,
  updateDriverLocation,
  myRecentSearches,
  updateProfileImage,
};
