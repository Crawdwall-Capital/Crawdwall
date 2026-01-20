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
                role: 'OFFICER',
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
                role: 'OFFICER'
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

/**
 * GET SUBMITTED PROPOSALS FOR REVIEW
 */
export const getSubmittedProposals = async (req, res) => {
    try {
        const proposals = await officerService.getSubmittedProposals();

        return successResponse(res, {
            proposals: proposals.map(proposal => ({
                id: proposal.id,
                eventTitle: proposal.eventTitle,
                description: proposal.description,
                expectedRevenue: proposal.expectedRevenue,
                timeline: proposal.timeline,
                status: proposal.status,
                submittedAt: proposal.createdAt,
                organizerName: proposal.organizerName
            }))
        });

    } catch (error) {
        console.error('Get submitted proposals error:', error);
        return errorResponse(res, error.message, 500);
    }
};

/**
 * GET PROPOSAL DETAILS FOR REVIEW
 */
export const getProposalDetails = async (req, res) => {
    try {
        const { proposalId } = req.params;
        const proposal = await officerService.getProposalDetails(proposalId);

        return successResponse(res, {
            proposal: {
                id: proposal.id,
                eventTitle: proposal.eventTitle,
                description: proposal.description,
                expectedRevenue: proposal.expectedRevenue,
                timeline: proposal.timeline,
                status: proposal.status,
                submittedAt: proposal.createdAt,
                organizerName: proposal.organizerName,
                organizerEmail: proposal.organizerEmail
            }
        });

    } catch (error) {
        console.error('Get proposal details error:', error);
        return errorResponse(res, error.message, 404);
    }
};

/**
 * GET MY REVIEWS (LEGACY)
 */
export const getMyReviews = async (req, res) => {
    try {
        const officerId = req.user.userId;
        const reviews = await officerService.getOfficerReviews(officerId);

        return successResponse(res, {
            reviews: reviews.map(review => ({
                id: review.id,
                proposalId: review.proposalId,
                decision: review.decision,
                riskAssessment: review.riskAssessment,
                revenueComment: review.revenueComment,
                notes: review.notes,
                submittedAt: review.createdAt
            }))
        });

    } catch (error) {
        console.error('Get officer reviews error:', error);
        return errorResponse(res, error.message, 500);
    }
};