import Stripe from "stripe";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Organization from "../models/organization.model.js";
import { createNotification } from "../services/notification.service.js";

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

export const createCheckoutSession = async (req, res) => {
  try {
    const { _id: userId, email: userEmail, currentOrganizationId } = req.user;
    const { planName = 'PREMIUM' } = req.body; 

    if (!currentOrganizationId) {
        return res.status(400).json({ 
            success: false, 
            message: "User does not belong to any organization" 
        });
    }

    const selectedPlan = PLAN_CONFIG[planName];
    if (!selectedPlan) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid plan name. Available plans: ${Object.keys(PLAN_CONFIG).join(', ')}` 
      });
    }

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
        userId: userId.toString(), 
        organizationId: currentOrganizationId.toString(),
        targetPlan: planName 
      },

      // Truyền metadata vào subscription để invoice.payment_succeeded có thể tìm org
      subscription_data: {
        metadata: {
          userId: userId.toString(),
          organizationId: currentOrganizationId.toString(),
          targetPlan: planName
        }
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
 * [UPDATED] Webhook with Debug Logging
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
    console.log("[Webhook Received]", event.type);
  } catch (err) {
    console.error(` Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case "checkout.session.completed": {
        const session = event.data.object;
        console.log("[Session Data]:", {
            metadata: session.metadata,
            subscription: session.subscription,
            mode: session.mode
        });

        const { organizationId, targetPlan = "PREMIUM", userId } = session.metadata || {};

        if (organizationId) {
            try {
                // [FIX TRIỆT ĐỂ] Lấy subscriptionExpiredAt từ Stripe subscription
                let subscriptionExpiredAt = null;
                let subscriptionId = session.subscription;
                
                if (subscriptionId) {
                    try {
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                        console.log(" [Stripe Subscription]:", {
                            id: subscription.id,
                            status: subscription.status,
                            current_period_end: subscription.current_period_end
                        });
                        
                        if (subscription.current_period_end) {
                            subscriptionExpiredAt = new Date(subscription.current_period_end * 1000);
                            console.log(" [ExpiredAt from Stripe]:", subscriptionExpiredAt);
                        }
                    } catch (stripeErr) {
                        console.error(" [Stripe API Error]:", stripeErr.message);
                    }
                }
                
                // [FALLBACK] Nếu không lấy được từ Stripe, set 30 ngày từ bây giờ
                if (!subscriptionExpiredAt) {
                    subscriptionExpiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    console.log(" [Fallback ExpiredAt]:", subscriptionExpiredAt);
                }

                const updatedOrg = await Organization.findByIdAndUpdate(organizationId, { 
                    plan: targetPlan,
                    subscriptionStatus: "ACTIVE",  
                    subscriptionId: subscriptionId,
                    subscriptionExpiredAt: subscriptionExpiredAt,
                    updatedAt: new Date()
                }, { new: true });

                console.log(` [DB Update Complete] Org ${organizationId}:`, {
                    plan: updatedOrg?.plan,
                    subscriptionStatus: updatedOrg?.subscriptionStatus,
                    subscriptionExpiredAt: updatedOrg?.subscriptionExpiredAt
                });

                if (userId) {
                    await User.findByIdAndUpdate(userId, {
                        role: 'Admin'
                    });

                    await createNotification({
                        userId: userId,
                        title: "Upgrade Successful",
                        message: `Your organization has been upgraded to ${targetPlan}.`,
                        type: "SUCCESS"
                     });
                }
            } catch (err) {
                console.error("Database update failed:", err);
            }
        } else {
             console.error("[WARNING] Missing organizationId in metadata! Cannot update DB.");
        }
        break;
    }

    case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        console.log("[Invoice Payment Succeeded]:", {
            subscriptionId,
            invoiceId: invoice.id,
            billing_reason: invoice.billing_reason
        });

        if (subscriptionId) {
            try {
                // Lấy subscription để có period_end chính xác
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const expiredAt = new Date(subscription.current_period_end * 1000);
                
                console.log("[Subscription Period End]:", expiredAt);

                // Tìm org bằng subscriptionId
                let org = await Organization.findOne({ subscriptionId: subscriptionId });
                
                // [FALLBACK] Nếu không tìm được bằng subscriptionId, thử tìm bằng metadata từ subscription
                if (!org && subscription.metadata?.organizationId) {
                    org = await Organization.findById(subscription.metadata.organizationId);
                    console.log("[Found org via metadata]:", org?._id);
                }

                if (org) {
                    await Organization.findByIdAndUpdate(org._id, { 
                        subscriptionStatus: "ACTIVE",
                        subscriptionExpiredAt: expiredAt,
                        subscriptionId: subscriptionId // Đảm bảo subscriptionId được lưu
                    });
                    
                    console.log(`[Invoice Update] Org ${org._id} expiredAt set to ${expiredAt}`);
                    
                    await createNotification({
                        userId: org.ownerId,
                        title: "Payment Successful",
                        message: `Premium plan active until ${expiredAt.toLocaleDateString()}.`,
                        type: "INFO"
                    });
                } else {
                    console.log("[Invoice] No org found for subscriptionId:", subscriptionId);
                }
            } catch (err) {
                console.error("Invoice update failed:", err);
            }
        }
        break;
    }

    case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
            try {
                const org = await Organization.findOneAndUpdate(
                    { subscriptionId: subscriptionId },
                    { subscriptionStatus: "PAST_DUE" },
                    { new: true }
                );

                if (org) {
                    console.log(`[Payment Failed] Org ${org._id} marked as PAST_DUE`);
                    await createNotification({
                        userId: org.ownerId,
                        title: "Payment Failed",
                        message: "Renewal payment failed. Please check your payment method.",
                        type: "WARNING"
                    });
                }
            } catch (err) {
                console.error("Payment failed update error:", err);
            }
        }
        break;
    }

    case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        if (subscriptionId) {
            try {
                const org = await Organization.findOneAndUpdate(
                    { subscriptionId: subscriptionId },
                    { 
                        plan: "FREE",              
                        subscriptionStatus: "INACTIVE", 
                        subscriptionId: null,      
                        subscriptionExpiredAt: null
                    },
                    { new: true }
                );

                if (org) {
                    console.log(`[Expired] Org ${org._id} downgraded to FREE`);
                    await createNotification({
                        userId: org.ownerId,
                        title: "Premium Expired",
                        message: "Your Premium plan has expired. Account downgraded to Free.",
                        type: "ERROR"
                    });
                }
            } catch (err) {
                console.error("Subscription deleted error:", err);
            }
        }
        break;
    }
  }

  res.status(200).json({ received: true });
};

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
      await stripe.subscriptions.update(organization.subscriptionId, {
        cancel_at_period_end: true
      });
    } catch (stripeError) {
      console.error("Stripe Cancel Error:", stripeError);
      if (stripeError.code !== 'resource_missing') {
          return res.status(500).json({ success: false, message: "Failed to cancel with payment provider" });
      }
    }

    organization.subscriptionStatus = "CANCELLED";
    organization.updatedAt = new Date();
    
    await organization.save();

    const expiredDate = organization.subscriptionExpiredAt 
        ? new Date(organization.subscriptionExpiredAt).toLocaleDateString() 
        : "end of period";

    await createNotification({
        userId: organization.ownerId,
        title: "Cancellation Scheduled",
        message: `Premium cancellation scheduled. You can use Premium features until ${expiredDate}.`,
        type: "WARNING"
    });

    return res.status(200).json({
      success: true,
      message: "Subscription scheduled for cancellation at the end of the billing period.",
      data: { 
          plan: organization.plan,
          status: "CANCELLED",
          expiredAt: organization.subscriptionExpiredAt
      }
    });

  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resumeSubscription = async (req, res) => {
  try {
    const { currentOrganizationId } = req.user;

    const organization = await Organization.findById(currentOrganizationId);
    if (!organization || !organization.subscriptionId) {
        return res.status(404).json({ success: false, message: "No active subscription found" });
    }

    await stripe.subscriptions.update(organization.subscriptionId, {
        cancel_at_period_end: false
    });

    organization.subscriptionStatus = "ACTIVE";
    organization.updatedAt = new Date();
    await organization.save();

    await createNotification({
        userId: organization.ownerId,
        title: "Subscription Resumed",
        message: "Your Premium plan has been reactivated successfully. Auto-renewal is now enabled.",
        type: "SUCCESS"
    });

    return res.status(200).json({ 
        success: true, 
        message: "Subscription resumed successfully",
        data: {
            status: "ACTIVE",
            plan: organization.plan
        }
    });

  } catch (error) {
    console.error("Resume Subscription Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPortalSession = async (req, res) => {
  try {
    const { currentOrganizationId } = req.user;
    const organization = await Organization.findById(currentOrganizationId);

    if (!organization || !organization.subscriptionId) {
         return res.status(400).json({ success: false, message: "No active subscription found to manage." });
    }

    const subscription = await stripe.subscriptions.retrieve(organization.subscriptionId);
    const customerId = subscription.customer;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/admin/settings`, 
    });

    res.status(200).json({ success: true, url: session.url });

  } catch (error) {
    console.error("Portal Session Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};