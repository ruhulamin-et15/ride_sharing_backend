import stripe from "../../../config/stripe";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

const createIntentInStripe = async (payload: {
  amount: number;
  currency: string;
  paymentMethodId: string;
}) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency: payload.currency,
    payment_method: payload.paymentMethodId,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
  });

  return paymentIntent;
};

const saveCardInStripe = async (
  payload: {
    paymentMethodId: string;
    cardholderName: string;
  },
  userId: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  const { paymentMethodId, cardholderName } = payload;
  let customerId = user.customerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email as string,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { customerId },
    });
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  const newCard: any = await stripe.paymentMethods.retrieve(paymentMethodId);

  const existingCard = paymentMethods.data.find(
    (card: any) => card.card.last4 === newCard.card.last4
  );

  if (existingCard) {
    throw new ApiError(409, "This card is already saved.");
  } else {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    await stripe.paymentMethods.update(paymentMethodId, {
      billing_details: {
        name: cardholderName,
      },
    });
    return {
      message: "Customer created and card saved successfully",
    };
  }
};

const getSaveCardsFromStripe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found!");
  }
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.customerId as string, // Use the customer ID to list the payment methods
      type: "card", // Ensure you're retrieving only card payment methods
    });

    if (paymentMethods.data.length === 0) {
      throw new ApiError(404, "No saved cards found");
    }

    // Extract relevant card details (brand, country, funding, last4, type, cardholder name)
    const cards = paymentMethods.data.map((card: any) => ({
      brand: card.card.brand, // Card brand (e.g., Visa, MasterCard)
      country: card.card.country, // Country of the card
      funding: card.card.funding, // Funding type (e.g., credit, debit)
      last4: card.card.last4, // Last 4 digits of the card number
      type: card.card.checks.cvc_check === "pass" ? "Valid" : "Invalid", // Card validity check
      cardholderName: card.billing_details.name || "Unknown", // Cardholder's name
    }));

    return cards;
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    throw new ApiError(500, "Error fetching saved cards");
  }
};

const deleteCardByLast4 = async (last4: string, userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  let customerId = user.customerId;
  if (!customerId) {
    throw new ApiError(404, "Customer not found!");
  }
  // Fetch the customer's saved payment methods (cards)
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  // Find the card that matches the last 4 digits
  const cardToDelete = paymentMethods.data.find(
    (card: any) => card.card.last4 === last4
  );

  if (!cardToDelete) {
    throw new ApiError(404, "Card with the specified last 4 digits not found!");
  }

  // Detach (delete) the card
  await stripe.paymentMethods.detach(cardToDelete.id);

  return {
    message: "Card deleted successfully",
  };
};

export const paymentServices = {
  createIntentInStripe,
  saveCardInStripe,
  getSaveCardsFromStripe,
  deleteCardByLast4,
};
