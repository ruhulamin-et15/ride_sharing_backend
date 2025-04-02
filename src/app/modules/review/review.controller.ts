import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { reviewServices } from "./review.service";

const createReview = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { bookingId } = req.params;
  const payload = {
    ...req.body,
    userId,
    bookingId,
  };
  const result = await reviewServices.createReviewInDB(payload);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

export const reviewControllers = {
  createReview,
};
