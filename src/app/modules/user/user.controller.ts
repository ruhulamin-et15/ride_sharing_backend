import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";

//send otp
const registrationWithOTP = catchAsync(async (req, res) => {
  await userService.registrationWithOTP(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP send successfully",
  });
});

// create user
const otpVerifyForRegistration = catchAsync(
  async (req: Request, res: Response) => {
    const result = await userService.otpVerifyForRegistration(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "User created successfully",
      data: result,
    });
  }
);

//get users
const getUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await userService.getUsersIntoDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "users retrived successfully",
    data: users,
  });
});

//get single user
const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getSingleUserIntoDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user retrived successfully",
    data: user,
  });
});

//update user
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const updatedUser = await userService.updateUserIntoDB(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user updated successfully",
    data: updatedUser,
  });
});

//delete user
const deleteUser = catchAsync(async (req: any, res: Response) => {
  const userId = req.params.id;
  const loggedId = req.user.id;
  await userService.deleteUserIntoDB(userId, loggedId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user deleted successfully",
  });
});

export const UserControllers = {
  registrationWithOTP,
  otpVerifyForRegistration,
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
};
