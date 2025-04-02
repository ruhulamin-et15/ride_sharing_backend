import prisma from "../../../shared/prisma";

const createReviewInDB = async (payload: {
  bookingId: string;
  userId: string;
  rating: number;
  comment: string;
}) => {
  const { bookingId, userId, rating, comment } = payload;
  const review = await prisma.review.create({
    data: {
      bookingId,
      userId,
      comment,
      rating,
    },
  });
  return review;
};

export const reviewServices = {
  createReviewInDB,
};
