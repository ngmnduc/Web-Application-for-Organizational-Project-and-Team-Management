import User from "../models/user.model.js";
import Organization from "../models/organization.model.js";
import ProjectMember from "../models/projectMember.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Stripe from "stripe"; 

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 

const generateToken = (id, role, organizationId) => {
  return jwt.sign(
    { id, role, organizationId },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

export const register = async (req, res) => {
  const { name, email, password, organizationName, plan } = req.body; 

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password, role: "Admin" });

    const organization = await Organization.create({
      name: organizationName,
      ownerId: user._id,
      plan: "FREE", 
      subscriptionStatus: "INACTIVE"
    });

    user.currentOrganizationId = organization._id;
    await user.save();

    const token = generateToken(user._id, user.role, organization._id);

    let paymentUrl = null;
    if (plan === "PREMIUM") {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Premium Plan Subscription",
                  description: "Unlock unlimited projects (Signup Upgrade)",
                },
                unit_amount: 2900,
                recurring: { interval: "month" },
              },
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${process.env.CLIENT_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.CLIENT_URL}/billing/cancel`,
          metadata: {
            organizationId: organization._id.toString(),
            userId: user._id.toString(),
            targetPlan: "PREMIUM"
          },
        });
        paymentUrl = session.url;
      } catch (stripeError) {
        console.error("Stripe Session Creation Failed during Signup:", stripeError);
      }
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      currentOrganizationId: user.currentOrganizationId,
      token,
      paymentUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const orgId = user.currentOrganizationId;

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        currentOrganizationId: orgId,
        token: generateToken(user._id, user.role, orgId),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};