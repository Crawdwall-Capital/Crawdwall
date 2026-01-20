import express from 'express';
import { createProposal, getMyProposals, getProposalHistory, updateProposal, submitProposal, getProposalDetails } from './proposal.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Submit proposal - only for organizers
router.post(
  '/',
  authenticate,
  authorize('ORGANIZER'),
  createProposal
);

// Update proposal (draft only) - only for organizers
router.put(
  '/:id',
  authenticate,
  authorize('ORGANIZER'),
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