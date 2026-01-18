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