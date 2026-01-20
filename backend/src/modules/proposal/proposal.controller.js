/**
 * Submit a new proposal (Enhanced for PRD compliance)
 * @route POST /organizer/proposals
 * @group Organizer - Operations related to organizer proposals
 * @param {string} eventTitle.body.required - Event title
 * @param {string} description.body.required - Description of the event
 * @param {number} expectedRevenue.body.required - Expected revenue amount
 * @param {string} timeline.body.required - Timeline for the event
 * @param {string} pitchVideoUrl.body.optional - URL to the pitch video
 * @param {boolean} isDraft.body.optional - Whether to save as draft (default: false)
 * @returns {object} 201 - Success response with proposal ID and status
 * @returns {object} 400 - Validation error
 * @returns {object} 401 - Unauthorized
 * @returns {object} 403 - Forbidden
 */
import * as proposalService from './proposal.service.js';
import { createProposalSchema } from './proposal.validation.js';
import { uploadMultiple } from '../../config/upload.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const createProposal = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = createProposalSchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const { isDraft = false, ...proposalData } = value;

    const proposal = await proposalService.createProposal(
      req.user.userId,
      proposalData,
      isDraft
    );

    return successResponse(res, {
      message: isDraft ? 'Proposal saved as draft' : 'Proposal submitted successfully',
      proposal: {
        id: proposal.id,
        status: proposal.status,
        createdAt: proposal.createdAt
      }
    }, 201);
  } catch (err) {
    console.error('Create proposal error:', err);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Update proposal (Draft only)
 * @route PUT /organizer/proposals/:id
 */
export const updateProposal = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body
    const { error, value } = createProposalSchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const proposal = await proposalService.updateProposal(
      id,
      req.user.userId,
      value
    );

    return successResponse(res, {
      message: 'Proposal updated successfully',
      proposal: {
        id: proposal.id,
        status: proposal.status,
        updatedAt: proposal.updatedAt
      }
    }, 200);
  } catch (err) {
    console.error('Update proposal error:', err);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Submit proposal (Convert from DRAFT to SUBMITTED)
 * @route POST /organizer/proposals/:id/submit
 */
export const submitProposal = async (req, res, next) => {
  try {
    const { id } = req.params;

    const proposal = await proposalService.submitProposal(
      id,
      req.user.userId
    );

    return successResponse(res, {
      message: 'Proposal submitted for review',
      proposal: {
        id: proposal.id,
        status: proposal.status,
        updatedAt: proposal.updatedAt
      }
    }, 200);
  } catch (err) {
    console.error('Submit proposal error:', err);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * View organizer's proposals (Enhanced with voting info)
 * @route GET /organizer/proposals
 * @group Organizer - Operations related to organizer proposals
 * @returns {Array<object>} 200 - Array of proposals with voting info
 * @returns {object} 401 - Unauthorized
 * @returns {object} 403 - Forbidden
 */
export const getMyProposals = async (req, res, next) => {
  try {
    const proposals = await proposalService.getProposalsByOrganizer(
      req.user.userId
    );

    // Format the response to match the API specification
    const formattedProposals = proposals.map(proposal => ({
      id: proposal.id,
      eventTitle: proposal.eventTitle,
      status: proposal.status,
      lastUpdated: proposal.updatedAt,
      createdAt: proposal.createdAt,
      votingInfo: {
        totalVotes: parseInt(proposal.vote_count) || 0,
        acceptVotes: parseInt(proposal.accept_votes) || 0,
        threshold: 4,
        thresholdMet: (parseInt(proposal.accept_votes) || 0) >= 4
      }
    }));

    return successResponse(res, {
      proposals: formattedProposals
    }, 200);
  } catch (err) {
    console.error('Get proposals error:', err);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Get proposal details (Organizer view)
 * @route GET /organizer/proposals/:id
 */
export const getProposalDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const proposal = await proposalService.getProposalDetails(
      id,
      req.user.userId,
      req.user.role
    );

    // Check if organizer owns this proposal
    if (proposal.organizerId !== req.user.userId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, {
      proposal
    }, 200);
  } catch (err) {
    console.error('Get proposal details error:', err);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * View proposal status history
 * @route GET /organizer/proposals/:id/history
 * @group Organizer - Operations related to organizer proposals
 * @param {string} id.path.required - Proposal ID
 * @returns {Array<object>} 200 - Array of status history
 * @returns {object} 400 - Invalid ID parameter
 * @returns {object} 401 - Unauthorized
 * @returns {object} 403 - Forbidden
 */
export const getProposalHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate that the id parameter is a valid ID
    if (!id) {
      return errorResponse(res, 'Proposal ID is required', 400);
    }

    const history = await proposalService.getProposalStatusHistory(id);

    return successResponse(res, {
      history
    }, 200);
  } catch (err) {
    console.error('Get proposal history error:', err);
    return errorResponse(res, err.message, 400);
  }
};
