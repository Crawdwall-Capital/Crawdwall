import express from 'express';
import { getAllSubmittedProposals, getProposalDetails, submitVote } from './admin.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// View all submitted proposals - only for admins
router.get(
  '/proposals',
  authenticate,
  authorize('ADMIN'),
  getAllSubmittedProposals
);

// View proposal details (triggers UNDER_REVIEW status) - only for admins
router.get(
  '/proposals/:proposalId',
  authenticate,
  authorize('ADMIN'),
  getProposalDetails
);

// Submit vote and review for a proposal - only for admins
router.post(
  '/proposals/:proposalId/vote',
  authenticate,
  authorize('ADMIN'),
  submitVote
);

export default router;