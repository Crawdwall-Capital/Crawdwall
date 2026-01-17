import express from 'express';
import { createProposal, getMyProposals, getProposalHistory } from './proposal.controller.js';
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

// View my proposals - only for organizers
router.get(
  '/',
  authenticate,
  authorize('ORGANIZER'),
  getMyProposals
);

// View proposal status history - only for organizers
router.get(
  '/:id/history',
  authenticate,
  authorize('ORGANIZER'),
  getProposalHistory
);

export default router;