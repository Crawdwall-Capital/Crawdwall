import * as adminService from './admin.service.js';
import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * REQUEST ADMIN OTP
 */
export const requestAdminOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const result = await adminService.requestAdminOTP(email);
    return successResponse(res, result, 200);

  } catch (error) {
    console.error('Request OTP error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * VERIFY ADMIN OTP AND LOGIN
 */
export const verifyAdminOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return errorResponse(res, 'Email and OTP are required', 400);
    }

    const admin = await adminService.verifyAdminOTP(email, otp);

    // Generate JWT token for admin
    const token = jwt.sign(
      {
        userId: 'admin',
        role: 'ADMIN',
        email: admin.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return successResponse(res, {
      message: 'Login successful',
      token,
      role: 'ADMIN'
    }, 200);

  } catch (error) {
    console.error('Verify OTP error:', error);
    return errorResponse(res, error.message, 401);
  }
};

/**
 * CREATE OFFICER
 */
export const createOfficer = async (req, res) => {
  try {
    const { email, name, password } = req.body;
    const adminEmail = req.user.email;

    if (!email || !name || !password) {
      return errorResponse(res, 'Email, name, and password are required', 400);
    }

    const officer = await adminService.createOfficer(adminEmail, { email, name, password });

    return successResponse(res, {
      message: 'Officer created successfully',
      officer: {
        id: officer.id,
        email: officer.email,
        name: officer.name,
        status: officer.status,
        createdAt: officer.createdAt
      }
    }, 201);

  } catch (error) {
    console.error('Create officer error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET ALL OFFICERS
 */
export const getAllOfficers = async (req, res) => {
  try {
    const adminEmail = req.user.email;
    const officers = await adminService.getAllOfficers(adminEmail);

    return successResponse(res, { officers }, 200);

  } catch (error) {
    console.error('Get officers error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * UPDATE OFFICER STATUS
 */
export const updateOfficerStatus = async (req, res) => {
  try {
    const { officerId } = req.params;
    const { status } = req.body;
    const adminEmail = req.user.email;

    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }

    const officer = await adminService.updateOfficerStatus(adminEmail, officerId, status);

    return successResponse(res, {
      message: 'Officer status updated successfully',
      officer
    }, 200);

  } catch (error) {
    console.error('Update officer status error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * DELETE OFFICER
 */
export const deleteOfficer = async (req, res) => {
  try {
    const { officerId } = req.params;
    const adminEmail = req.user.email;

    const officer = await adminService.deleteOfficer(adminEmail, officerId);

    return successResponse(res, {
      message: 'Officer deleted successfully',
      officer
    }, 200);

  } catch (error) {
    console.error('Delete officer error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET PLATFORM STATISTICS
 */
export const getPlatformStats = async (req, res) => {
  try {
    const adminEmail = req.user.email;
    const stats = await adminService.getPlatformStats(adminEmail);

    return successResponse(res, { stats }, 200);

  } catch (error) {
    console.error('Get platform stats error:', error);
    return errorResponse(res, error.message, 400);
  }
};
/**
 * GET ALL USERS
 */
export const getAllUsers = async (req, res) => {
  try {
    const adminEmail = req.user.email;
    const users = await adminService.getAllUsers(adminEmail);

    return successResponse(res, { users }, 200);

  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET USER DETAILS
 */
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminEmail = req.user.email;

    const user = await adminService.getUserDetails(adminEmail, userId);

    return successResponse(res, { user }, 200);

  } catch (error) {
    console.error('Get user details error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * DELETE USER
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminEmail = req.user.email;

    const user = await adminService.deleteUser(adminEmail, userId);

    return successResponse(res, {
      message: 'User deleted successfully',
      user
    }, 200);

  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET ALL PROPOSALS
 */
export const getAllProposals = async (req, res) => {
  try {
    const adminEmail = req.user.email;
    const proposals = await adminService.getAllProposals(adminEmail);

    return successResponse(res, { proposals }, 200);

  } catch (error) {
    console.error('Get all proposals error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET PROPOSAL DETAILS
 */
export const getProposalDetails = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const adminEmail = req.user.email;

    const proposal = await adminService.getProposalDetails(adminEmail, proposalId);

    return successResponse(res, { proposal }, 200);

  } catch (error) {
    console.error('Get proposal details error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * UPDATE PROPOSAL STATUS
 */
export const updateProposalStatus = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { status } = req.body;
    const adminEmail = req.user.email;

    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }

    const proposal = await adminService.updateProposalStatus(adminEmail, proposalId, status);

    return successResponse(res, {
      message: 'Proposal status updated successfully',
      proposal
    }, 200);

  } catch (error) {
    console.error('Update proposal status error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * DELETE PROPOSAL
 */
export const deleteProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const adminEmail = req.user.email;

    const proposal = await adminService.deleteProposal(adminEmail, proposalId);

    return successResponse(res, {
      message: 'Proposal deleted successfully',
      proposal
    }, 200);

  } catch (error) {
    console.error('Delete proposal error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * OVERRIDE PROPOSAL DECISION
 */
export const overrideProposalDecision = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { decision, reason } = req.body;
    const adminEmail = req.user.email;

    if (!decision || !reason) {
      return errorResponse(res, 'Decision and reason are required', 400);
    }

    const override = await adminService.overrideProposalDecision(adminEmail, proposalId, decision, reason);

    return successResponse(res, {
      message: 'Proposal decision overridden successfully',
      override
    }, 200);

  } catch (error) {
    console.error('Override proposal decision error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET PLATFORM CONFIGURATION
 */
export const getPlatformConfiguration = async (req, res) => {
  try {
    const adminEmail = req.user.email;
    const config = await adminService.getPlatformConfiguration(adminEmail);

    return successResponse(res, { config }, 200);

  } catch (error) {
    console.error('Get platform configuration error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * UPDATE PLATFORM CONFIGURATION
 */
export const updatePlatformConfiguration = async (req, res) => {
  try {
    const adminEmail = req.user.email;
    const configUpdates = req.body;

    const result = await adminService.updatePlatformConfiguration(adminEmail, configUpdates);

    return successResponse(res, result, 200);

  } catch (error) {
    console.error('Update platform configuration error:', error);
    return errorResponse(res, error.message, 400);
  }
};
export const getPlatformActivity = async (req, res) => {
  try {
    const adminEmail = req.user.email;
    const activity = await adminService.getPlatformActivity(adminEmail);

    return successResponse(res, { activity }, 200);

  } catch (error) {
    console.error('Get platform activity error:', error);
    return errorResponse(res, error.message, 400);
  }
};