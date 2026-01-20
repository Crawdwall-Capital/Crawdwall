/**
 * Submit a new proposal (Enhanced with all required fields and file upload support)
 * @route POST /organizer/proposals
 * @group Organizer - Operations related to organizer proposals
 * @param {string} eventTitle.body.required - Event title
 * @param {string} description.body.required - Description of the event
 * @param {string} eventType.body.required - Type of event (MUSIC_FESTIVAL, TECH_CONFERENCE, etc.)
 * @param {number} budgetRequested.body.required - Budget amount requested
 * @param {number} expectedRevenue.body.required - Expected revenue amount
 * @param {string} eventDuration.body.required - Duration of the event
 * @param {string} timeline.body.required - Timeline for the event
 * @param {string} revenuePlan.body.required - Detailed revenue plan
 * @param {string} targetAudience.body.required - Target audience description
 * @param {string} pitchVideoUrl.body.optional - URL to the pitch video
 * @param {boolean} isDraft.body.optional - Whether to save as draft (default: false)
 * @param {files} supportingDocuments.files.optional - Supporting documents (PDF, DOC, XLS up to 10MB)
 * @returns {object} 201 - Success response with proposal ID and status
 * @returns {object} 400 - Validation error
 * @returns {object} 401 - Unauthorized
 * @returns {object} 403 - Forbidden
 */
import * as proposalService from './proposal.service.js';
import { createProposalSchema, updateProposalSchema, EVENT_TYPES } from './proposal.validation.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const createProposal = async (req, res, next) => {
  try {
    // Handle file uploads first
    let supportingDocuments = [];

    if (req.files && req.files.length > 0) {
      supportingDocuments = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString()
      }));
    }

    // Validate request body
    const { error, value } = createProposalSchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const { isDraft = false, ...proposalData } = value;

    // Add supporting documents to proposal data
    proposalData.supportingDocuments = supportingDocuments;

    const proposal = await proposalService.createProposal(
      req.user.userId,
      proposalData,
      isDraft
    );

    return successResponse(res, {
      message: isDraft ? 'Proposal saved as draft' : 'Proposal submitted successfully',
      proposal: {
        id: proposal.id,
        eventTitle: proposal.eventTitle,
        eventType: proposal.eventType,
        budgetRequested: proposal.budgetRequested,
        status: proposal.status,
        createdAt: proposal.createdAt,
        supportingDocuments: supportingDocuments.length
      }
    }, 201);
  } catch (err) {
    console.error('Create proposal error:', err);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Get event types for dropdown
 * @route GET /organizer/event-types
 */
export const getEventTypes = async (req, res) => {
  try {
    const eventTypes = EVENT_TYPES.map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));

    return successResponse(res, {
      eventTypes
    });
  } catch (err) {
    console.error('Get event types error:', err);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Get organizer's proposals
 * @route GET /organizer/proposals
 */
export const getMyProposals = async (req, res) => {
  try {
    const proposals = await proposalService.getProposalsByOrganizer(req.user.userId);

    return successResponse(res, {
      proposals: proposals.map(proposal => ({
        id: proposal.id,
        eventTitle: proposal.eventTitle,
        eventType: proposal.eventType,
        budgetRequested: proposal.budgetRequested,
        expectedRevenue: proposal.expectedRevenue,
        status: proposal.status,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt
      }))
    });
  } catch (err) {
    console.error('Get my proposals error:', err);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Get proposal details with supporting documents
 * @route GET /organizer/proposals/:id
 */
export const getProposalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = await proposalService.getProposalById(id, req.user.userId);

    // Parse supporting documents from JSON
    let supportingDocuments = [];
    if (proposal.supportingDocuments) {
      try {
        supportingDocuments = JSON.parse(proposal.supportingDocuments);
      } catch (e) {
        console.warn('Failed to parse supporting documents:', e);
      }
    }

    return successResponse(res, {
      proposal: {
        id: proposal.id,
        eventTitle: proposal.eventTitle,
        description: proposal.description,
        eventType: proposal.eventType,
        budgetRequested: proposal.budgetRequested,
        expectedRevenue: proposal.expectedRevenue,
        eventDuration: proposal.eventDuration,
        timeline: proposal.timeline,
        revenuePlan: proposal.revenuePlan,
        targetAudience: proposal.targetAudience,
        pitchVideoUrl: proposal.pitchVideoUrl,
        supportingDocuments: supportingDocuments,
        status: proposal.status,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt
      }
    });
  } catch (err) {
    console.error('Get proposal details error:', err);
    return errorResponse(res, err.message, 404);
  }
};

/**
 * Update proposal (draft only)
 * @route PUT /organizer/proposals/:id
 */
export const updateProposal = async (req, res) => {
  try {
    const { id } = req.params;

    // Handle file uploads for update
    let supportingDocuments = [];
    if (req.files && req.files.length > 0) {
      supportingDocuments = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString()
      }));
    }

    // Validate request body
    const { error, value } = updateProposalSchema.validate(req.body);
    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    // Add supporting documents if any were uploaded
    if (supportingDocuments.length > 0) {
      value.supportingDocuments = supportingDocuments;
    }

    const updatedProposal = await proposalService.updateProposal(id, req.user.userId, value);

    return successResponse(res, {
      message: 'Proposal updated successfully',
      proposal: {
        id: updatedProposal.id,
        eventTitle: updatedProposal.eventTitle,
        status: updatedProposal.status,
        updatedAt: updatedProposal.updatedAt
      }
    });
  } catch (err) {
    console.error('Update proposal error:', err);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Submit proposal (convert from draft)
 * @route POST /organizer/proposals/:id/submit
 */
export const submitProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const submittedProposal = await proposalService.submitProposal(id, req.user.userId);

    return successResponse(res, {
      message: 'Proposal submitted successfully',
      proposal: {
        id: submittedProposal.id,
        eventTitle: submittedProposal.eventTitle,
        status: submittedProposal.status,
        submittedAt: submittedProposal.updatedAt
      }
    });
  } catch (err) {
    console.error('Submit proposal error:', err);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Get proposal status history
 * @route GET /organizer/proposals/:id/history
 */
export const getProposalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await proposalService.getProposalHistory(id, req.user.userId);

    return successResponse(res, {
      history: history.map(entry => ({
        status: entry.status,
        changedAt: entry.changedAt,
        notes: entry.notes
      }))
    });
  } catch (err) {
    console.error('Get proposal history error:', err);
    return errorResponse(res, err.message, 404);
  }
};