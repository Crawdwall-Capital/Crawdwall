/**
 * Submit a new proposal
 * @route POST /organizer/proposals
 * @group Organizer - Operations related to organizer proposals
 * @param {string} eventTitle.body.required - Event title
 * @param {string} description.body.required - Description of the event
 * @param {number} expectedRevenue.body.required - Expected revenue amount
 * @param {string} timeline.body.required - Timeline for the event
 * @param {string} pitchVideoUrl.body.optional - URL to the pitch video
 * @returns {object} 201 - Success response with proposal ID and status
 * @returns {object} 400 - Validation error
 * @returns {object} 401 - Unauthorized
 * @returns {object} 403 - Forbidden
 */
import * as proposalService from './proposal.service.js';
import { createProposalSchema } from './proposal.validation.js';
import { uploadMultiple } from '../../config/upload.js';

export const createProposal = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = createProposalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const proposal = await proposalService.createProposal(
      req.user.userId,
      value
    );
    
    res.status(201).json({
      id: proposal.id,
      status: proposal.status,
      createdAt: proposal.createdAt
    });
  } catch (err) {
    next(err);
  }
};

/**
 * View organizer's proposals
 * @route GET /organizer/proposals
 * @group Organizer - Operations related to organizer proposals
 * @returns {Array<object>} 200 - Array of proposals
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
      lastUpdated: proposal.updatedAt
    }));
    
    res.status(200).json(formattedProposals);
  } catch (err) {
    next(err);
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
      return res.status(400).json({ message: 'Proposal ID is required' });
    }
    
    const history = await proposalService.getProposalStatusHistory(id);
    
    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
};
