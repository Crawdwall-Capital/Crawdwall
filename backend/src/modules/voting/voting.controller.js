import * as votingService from './voting.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * SUBMIT VOTE ON PROPOSAL
 * POST /api/officer/proposals/:proposalId/vote
 */
export const submitVote = async (req, res) => {
    try {
        const { proposalId } = req.params;
        const officerId = req.user.userId;
        const { decision, riskAssessment, revenueComment, notes } = req.body;

        // Validate required fields
        if (!decision || !riskAssessment || !revenueComment) {
            return errorResponse(res, 'Decision, risk assessment, and revenue comment are required', 400);
        }

        const voteData = {
            decision: decision.toUpperCase(),
            riskAssessment,
            revenueComment,
            notes: notes || null
        };

        const result = await votingService.submitVote(officerId, proposalId, voteData);

        return successResponse(res, {
            message: 'Vote submitted successfully',
            vote: result
        }, 201);

    } catch (error) {
        console.error('Submit vote error:', error);
        return errorResponse(res, error.message, 400);
    }
};

/**
 * GET PROPOSAL VOTING INFORMATION
 * GET /api/officer/proposals/:proposalId/votes
 */
export const getProposalVotes = async (req, res) => {
    try {
        const { proposalId } = req.params;
        const officerId = req.user.userId;

        const votingInfo = await votingService.getProposalVotes(proposalId, officerId);

        return successResponse(res, {
            votingInfo
        }, 200);

    } catch (error) {
        console.error('Get proposal votes error:', error);
        return errorResponse(res, error.message, 400);
    }
};

/**
 * GET OFFICER'S VOTING HISTORY
 * GET /api/officer/votes/history
 */
export const getVotingHistory = async (req, res) => {
    try {
        const officerId = req.user.userId;

        const history = await votingService.getOfficerVotingHistory(officerId);

        return successResponse(res, {
            votingHistory: history
        }, 200);

    } catch (error) {
        console.error('Get voting history error:', error);
        return errorResponse(res, error.message, 400);
    }
};

/**
 * TRACK PROPOSAL VIEW (Middleware function)
 * This will be called when officer views a proposal
 */
export const trackProposalView = async (req, res, next) => {
    try {
        const { proposalId } = req.params;
        const officerId = req.user.userId;

        // Track the view asynchronously (don't block the request)
        votingService.trackProposalView(proposalId, officerId)
            .catch(error => {
                console.error('Error tracking proposal view:', error.message);
            });

        next();

    } catch (error) {
        // Don't block the request if view tracking fails
        console.error('View tracking middleware error:', error.message);
        next();
    }
};

/**
 * GET PROPOSAL AUDIT TRAIL (Admin only)
 * GET /api/admin/proposals/:proposalId/audit
 */
export const getProposalAuditTrail = async (req, res) => {
    try {
        const { proposalId } = req.params;

        const auditTrail = await votingService.getProposalAuditTrail(proposalId);

        return successResponse(res, {
            auditTrail
        }, 200);

    } catch (error) {
        console.error('Get audit trail error:', error);
        return errorResponse(res, error.message, 400);
    }
};