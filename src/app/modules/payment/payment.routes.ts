import express from "express";
import auth from "../../middlewares/auth";
import { paymentControllers } from "./payment.controller";

const router = express.Router();

router.post("/create-intent", auth(), paymentControllers.createIntent);
router.post("/save/cards", auth(), paymentControllers.saveCards);
router.get("/get-savecards", auth(), paymentControllers.getSaveCards);
router.delete("/delete-savecards", auth(), paymentControllers.deleteSaveCard);

export const paymentRoute = router;
