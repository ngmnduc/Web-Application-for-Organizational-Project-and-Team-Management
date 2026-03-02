import express from "express";
import { 
  createCheckoutSession, 
  handleWebhook,   
  cancelSubscription,
  resumeSubscription, 
  createPortalSession 
} from "../controllers/payment.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   POST /payment/session
 * @desc    Create payment link (Upgrade to Premium)
 */
router.post("/session", verifyToken, createCheckoutSession);

/**
 * @route   POST /payment/cancel
 * @desc    Cancel subscription (Schedule for end of period)
 */
router.post("/cancel", verifyToken, cancelSubscription);

/**
 * @route   POST /payment/resume
 * @desc    Reactivate subscription (Undo cancel) 
 */
router.post("/resume", verifyToken, resumeSubscription);

/**
 * @route   POST /payment/portal
 * @desc    Get Stripe Customer Portal link (Update Card) 
 */
router.post("/portal", verifyToken, createPortalSession);

export default router;