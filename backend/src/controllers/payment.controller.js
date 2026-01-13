import Stripe from "stripe";
import Organization from "../models/organization.model.js";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body;
    const { currentOrganizationId, _id: userId } = req.user;

    if (!currentOrganizationId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }

    if (plan !== "PREMIUM") {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Premium Plan Subscription",
              description: "Unlock unlimited projects and advanced features",
            },
            unit_amount: 2000,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.CLIENT_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/billing/cancel`,
      
      metadata: {
        organizationId: currentOrganizationId.toString(),
        userId: userId.toString(), 
        targetPlan: "PREMIUM"
      },
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

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
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { organizationId, targetPlan } = session.metadata || {};

    console.log(`💰 Payment success for Org: ${organizationId}, Plan: ${targetPlan}`);

    if (organizationId) {
      try {
        await Organization.findByIdAndUpdate(organizationId, {
          plan: "PREMIUM",
          subscriptionStatus: "ACTIVE", 
          subscriptionId: session.subscription, 
          updatedAt: new Date()
        });

        console.log(`Organization ${organizationId} upgraded to PREMIUM successfully.`);
      } catch (dbError) {
        console.error("Database Update Failed:", dbError);
      }
    } else {
      console.error("Missing organizationId in session metadata!");
    }
  }
  res.status(200).json({ received: true });
};

export const cancelSubscription = async (req, res) => {
  try {
    const { currentOrganizationId } = req.user;

    const organization = await Organization.findById(currentOrganizationId);

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    if (!organization.subscriptionId) {
      return res.status(400).json({ message: "No active subscription found to cancel" });
    }

    // 1. Call Stripe to cancel
    try {
      await stripe.subscriptions.cancel(organization.subscriptionId);
    } catch (stripeError) {
      console.error("Stripe Cancel Error:", stripeError);
      return res.status(500).json({ message: "Failed to cancel subscription with payment provider" });
    }

    // 2. Update Database (Downgrade to FREE)
    organization.plan = "FREE";
    organization.subscriptionStatus = "CANCELLED"; 
    organization.subscriptionId = null; 
    organization.updatedAt = new Date();
    
    await organization.save();

    res.status(200).json({ 
      message: "Subscription cancelled successfully. Plan downgraded to FREE.",
      plan: "FREE"
    });

  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
