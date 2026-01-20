import express from 'express';
import { createProposal, getMyProposals, getProposalHistory, updateProposal, submitProposal, getProposalDetails, getEventTypes } from './proposal.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { uploadMultiple } from '../../config/upload.js';

const router = express.Router();

// Get event types for dropdown - accessible to organizers
router.get(
  '/event-types',
  authenticate,
  authorize('ORGANIZER'),
  getEventTypes
);

// Submit proposal with file upload support - only for organizers
router.post(
  '/',
  authenticate,
  authorize('ORGANIZER'),
  uploadMultiple.array('supportingDocuments', 5), // Allow up to 5 files
  createProposal
);

// Update proposal (draft only) with file upload support - only for organizers
router.put(
  '/:id',
  authenticate,
  authorize('ORGANIZER'),
  uploadMultiple.array('supportingDocuments', 5), // Allow up to 5 files
  updateProposal
);

// Submit proposal (convert from draft) - only for organizers
router.post(
  '/:id/submit',
  authenticate,
  authorize('ORGANIZER'),
  submitProposal
);

// View my proposals - only for organizers
router.get(
  '/',
  authenticate,
  authorize('ORGANIZER'),
  getMyProposals
);

// View specific proposal details - only for organizers
router.get(
  '/:id',
  authenticate,
  authorize('ORGANIZER'),
  getProposalDetails
);

// View proposal status history - only for organizers
router.get(
  '/:id/history',
  authenticate,
  authorize('ORGANIZER'),
  getProposalHistory
);

export default router;