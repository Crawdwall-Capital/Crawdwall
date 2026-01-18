import express from 'express';
import * as officerController from './officer.controller.js';
import * as officerReviewController from './officer.review.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// Officer authentication
router.post('/login', officerController.loginOfficer);

// Officer profile (requires officer authentication)
router.get('/profile', authenticateToken, requireRole(['OFFICER']), officerController.getOfficerProfile);

// Officer review functions (requires officer authentication)
router.get('/proposals', authenticateToken, requireRole(['OFFICER']), officerReviewController.getSubmittedProposals);
router.get('/proposals/:proposalId', authenticateToken, requireRole(['OFFICER']), officerReviewController.getProposalDetails);
router.post('/proposals/:proposalId/vote', authenticateToken, requireRole(['OFFICER']), officerReviewController.submitVote);
router.get('/reviews', authenticateToken, requireRole(['OFFICER']), officerReviewController.getMyReviews);

export default router;