import mongoose from "mongoose";
import Organization from "../models/organization.model.js";
import OrganizationMember from "../models/organizationMember.model.js";
import User from "../models/user.model.js";

/**
 * @desc    Create new organization
 * @route   POST /api/organizations
 * @access  Private
 */
export const createOrganization = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name } = req.body;
    const userId = req.user._id; 

    // 1. Create Organization
    const [newOrg] = await Organization.create(
      [
        {
          name,
          ownerId: userId,
          plan: "FREE", 
          subscriptionStatus: "INACTIVE",
          inviteCode: Math.random().toString(36).substring(7).toUpperCase(),
        },
      ],
      { session }
    );

    // 2. Add creator as ORG_ADMIN
    await OrganizationMember.create(
      [
        {
          organizationId: newOrg._id,
          userId: userId,
          roleInOrganization: "ORG_ADMIN",
        },
      ],
      { session }
    );

    // 3. Update User 
    await User.findByIdAndUpdate(
      userId,
      { 
        role: 'Admin', 
        currentOrganizationId: newOrg._id, 
        $addToSet: { organizations: newOrg._id }
      },
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: newOrg,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get current organization data
 * @route   GET /api/organizations/current
 * @access  Private
 */
export const getCurrentOrganization = async (req, res) => {
  try {
    const { currentOrganizationId } = req.user;

    if (!currentOrganizationId) {
      return res.status(400).json({ 
        success: false, 
        message: "User does not belong to any organization" 
      });
    }

    const organization = await Organization.findById(currentOrganizationId);

    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: "Organization not found" 
      });
    }

    return res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};