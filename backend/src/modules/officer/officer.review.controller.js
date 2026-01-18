import * as officerReviewService from './officer.review.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET ALL SUBMITTED PROPOSALS (for Officer review)
 */
export const getSubmittedProposals = async (req, res) => {
    try {
        const proposals = await officerReviewService.getSubmittedProposals();
        return successResponse(res, { proposals }, 200);

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
        const officerId = req.user.userId;

        const proposal = await officerReviewService.getProposalForReview(proposalId, officerId);

        return successResponse(res, { proposal }, 200);

    } catch (error) {
        console.error('Get proposal details error:', error);
        return errorResponse(res, error.message, 404);
    }
};

/**
 * SUBMIT VOTE ON PROPOSAL
 */
export const submitVote = async (req, res) => {
    try {
        const { proposalId } = req.params;
        const officerId = req.user.userId;
        const { vote, riskAssessment, revenueComment, notes } = req.body;

        if (!vote) {
            return errorResponse(res, 'Vote is required', 400);
        }

        if (!['ACCEPT', 'REJECT'].includes(vote)) {
            return errorResponse(res, 'Vote must be ACCEPT or REJECT', 400);
        }

        const result = await officerReviewService.submitVote(proposalId, officerId, {
            vote,
            riskAssessment,
            revenueComment,
            notes
        });

        return successResponse(res, {
            message: 'Vote submitted successfully',
            ...result
        }, 201);

    } catch (error) {
        console.error('Submit vote error:', error);
        return errorResponse(res, error.message, 400);
    }
};

/**
 * GET OFFICER'S REVIEW HISTORY
 */
export const getMyReviews = async (req, res) => {
    try {
        const officerId = req.user.userId;
        const reviews = await officerReviewService.getOfficerReviews(officerId);

        return successResponse(res, { reviews }, 200);

    } catch (error) {
        console.error('Get officer reviews error:', error);
        return errorResponse(res, error.message, 500);
    }
};