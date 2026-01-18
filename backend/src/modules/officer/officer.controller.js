import * as officerService from './officer.service.js';
import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * OFFICER LOGIN
 */
export const loginOfficer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', 400);
        }

        const officer = await officerService.loginOfficer({ email, password });

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: officer.id,
                role: officer.role,
                email: officer.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return successResponse(res, {
            message: 'Login successful',
            token,
            officer: {
                id: officer.id,
                email: officer.email,
                name: officer.name,
                role: officer.role
            }
        }, 200);

    } catch (error) {
        console.error('Officer login error:', error);
        return errorResponse(res, error.message, 401);
    }
};

/**
 * GET OFFICER PROFILE
 */
export const getOfficerProfile = async (req, res) => {
    try {
        const officerId = req.user.userId;
        const officer = await officerService.getOfficerById(officerId);

        return successResponse(res, {
            officer: {
                id: officer.id,
                email: officer.email,
                name: officer.name,
                status: officer.status,
                createdAt: officer.createdAt
            }
        });

    } catch (error) {
        console.error('Get officer profile error:', error);
        return errorResponse(res, error.message, 404);
    }
};