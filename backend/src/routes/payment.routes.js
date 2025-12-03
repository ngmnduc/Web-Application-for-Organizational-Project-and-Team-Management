import express from "express";
import { createCheckoutSession, handleWebhook } from "../controllers/payment.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   POST /payment/session
 * @desc    Create payment link
 */
router.post("/session", verifyToken, createCheckoutSession);

/**
 * @route   POST /payment/webhook
 * @desc    Stripe webhook listener
 */
router.post("/webhook", handleWebhook);

export default router;