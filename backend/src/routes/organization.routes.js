import express from "express";
import { 
  createOrganization, 
  getCurrentOrganization
} from "../controllers/organization.controller.js";
import { verifyToken } from "../middlewares/auth.js"; 

const router = express.Router();

/**
 * @desc    Create a new organization and assign the creator as ORG_ADMIN
 * @route   POST /api/organizations
 * @access  Private
 */
router.post("/organizations", verifyToken, createOrganization);

/**
 * @desc    Get current organization data 
 * @route   GET /api/organizations/current
 * @access  Private
 */
router.get("/organizations/current", verifyToken, getCurrentOrganization); 

export default router;