import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { paymentServices } from "./payment.service";

const createIntent = catchAsync(async (req, res) => {
  const intent = await paymentServices.createIntentInStripe(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Intent created successfully",
    data: intent,
  });
});

const saveCards = catchAsync(async (req, res) => {
  const userId = req.user.id;
  await paymentServices.saveCardInStripe(req.body, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cards saved successfully",
  });
});

const getSaveCards = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const cards = await paymentServices.getSaveCardsFromStripe(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "get save cards successfully",
    data: cards,
  });
});

const deleteSaveCard = catchAsync(async (req, res) => {
  const last4 = req.body.last4;
  const userId = req.user.id;
  await paymentServices.deleteCardByLast4(last4, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Delete card successfully",
  });
});

export const paymentControllers = {
  createIntent,
  saveCards,
  getSaveCards,
  deleteSaveCard,
};
