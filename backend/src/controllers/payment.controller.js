import Stripe from "stripe";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Organization from "../models/organization.model.js"; 

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLAN_CONFIG = {
  'PREMIUM': {
    name: "Premium Plan Upgrade",
    description: "Unlock unlimited projects and AI features",
    amount: 2000, 
    currency: "usd" 
  },
};

/**
 * @desc    Create Stripe Checkout Session
 * @route   POST /payment/session
 * @access  Private
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { _id: userId, email: userEmail, currentOrganizationId } = req.user;
    const { planName = 'PREMIUM' } = req.body; 

    // 1. Validate Org
    if (!currentOrganizationId) {
        return res.status(400).json({ 
            success: false, 
            message: "User does not belong to any organization" 
        });
    }

    // 2. Validate Plan
    const selectedPlan = PLAN_CONFIG[planName];
    if (!selectedPlan) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid plan name. Available plans: ${Object.keys(PLAN_CONFIG).join(', ')}` 
      });
    }

    // 3. Create Session (Mode Subscription)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription", 
      customer_email: userEmail,
      
      line_items: [
        {
          price_data: {
            currency: selectedPlan.currency,
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.amount, 
            recurring: {
                interval: "month", 
            },
          },
          quantity: 1,
        },
      ],

      metadata: {
        userId: userId.toString(), 
        organizationId: currentOrganizationId.toString(),
        targetPlan: planName 
      },

      success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/cancel`,
    });

    res.status(200).json({ 
        success: true, 
        url: session.url 
    });

  } catch (error) {
    console.error("Stripe Session Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Handle Stripe Webhook
 * @route   POST /payment/webhook
 * @access  Public
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    
    // Lấy thông tin từ Metadata
    const { organizationId, targetPlan = "PREMIUM", userId } = session.metadata || {};

    console.log(` Payment success. Org: ${organizationId}, User: ${userId}`);

    if (organizationId) {
        try {
            // 1. Update Organization -> PREMIUM
            await Organization.findByIdAndUpdate(organizationId, { 
                plan: targetPlan,
                subscriptionStatus: "ACTIVE",  
                subscriptionId: session.subscription,
                updatedAt: new Date()
            });
            console.log(` Organization ${organizationId} upgraded to ${targetPlan}`);

            // 2. Update user to admin
            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    role: 'Admin'
                });
                console.log(` User ${userId} promoted to ADMIN successfully.`);
            }

        } catch (err) {
            console.error(" Database update failed:", err);
        }
    } else {
        console.error(" Missing organizationId in session metadata!");
    }
  }

  res.status(200).json({ received: true });
};

/**
 * @desc    Cancel Subscription (Downgrade to FREE)
 * @route   POST /payment/cancel
 * @access  Private
 */
export const cancelSubscription = async (req, res) => {
  try {
    const { currentOrganizationId } = req.user;

    const organization = await Organization.findById(currentOrganizationId);

    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    if (!organization.subscriptionId) {
      organization.plan = "FREE";
      organization.subscriptionStatus = "INACTIVE";
      await organization.save();
      
      return res.status(200).json({ 
        success: true, 
        message: "Plan reset to FREE (No active Stripe subscription found)." 
      });
    }

    try {
      await stripe.subscriptions.cancel(organization.subscriptionId);
    } catch (stripeError) {
      console.error("Stripe Cancel Error:", stripeError);
      if (stripeError.code !== 'resource_missing') {
          return res.status(500).json({ success: false, message: "Failed to cancel with payment provider" });
      }
    }

    organization.plan = "FREE";
    organization.subscriptionStatus = "CANCELLED";
    organization.subscriptionId = null; 
    organization.updatedAt = new Date();
    
    await organization.save();

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully. Plan downgraded to FREE.",
      data: { plan: "FREE" }
    });

  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};