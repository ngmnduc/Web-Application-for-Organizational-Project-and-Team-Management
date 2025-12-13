import express from "express";
import { createOrganization } from "../controllers/organization.controller.js";
import { verifyToken } from "../middlewares/auth.js"; 

const router = express.Router();

/**
 * @desc    Create a new organization and assign the creator as ORG_ADMIN
 * @route   POST /api/organizations
 * @access  Private
 */
router.post("/organizations", verifyToken, createOrganization);

export default router;