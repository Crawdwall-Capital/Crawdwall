import express from 'express';
import * as officerController from './officer.controller.js';
import * as votingController from '../voting/voting.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// Officer authentication
router.post('/login', officerController.loginOfficer);

// Officer profile (requires officer authentication)
router.get('/profile', authenticate, requireRole(['OFFICER']), officerController.getOfficerProfile);

// Officer proposal review functions (requires officer authentication)
router.get('/proposals', authenticate, requireRole(['OFFICER']), officerController.getSubmittedProposals);
router.get('/proposals/:proposalId', authenticate, requireRole(['OFFICER']), votingController.trackProposalView, officerController.getProposalDetails);

// Officer voting functions (NEW - implements PRD voting system)
router.post('/proposals/:proposalId/vote', authenticate, requireRole(['OFFICER']), votingController.submitVote);
router.get('/proposals/:proposalId/votes', authenticate, requireRole(['OFFICER']), votingController.getProposalVotes);
router.get('/votes/history', authenticate, requireRole(['OFFICER']), votingController.getVotingHistory);

// Legacy review endpoints (keeping for backward compatibility)
router.get('/reviews', authenticate, requireRole(['OFFICER']), officerController.getMyReviews);

export default router;