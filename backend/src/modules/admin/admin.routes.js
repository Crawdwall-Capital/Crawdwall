import express from 'express';
import * as adminController from './admin.controller.js';
import * as votingController from '../voting/voting.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// Admin OTP authentication (no auth required)
router.post('/request-otp', adminController.requestAdminOTP);
router.post('/verify-otp', adminController.verifyAdminOTP);

// Admin functions (require admin authentication)
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// Officer management
router.post('/officers', adminController.createOfficer);
router.get('/officers', adminController.getAllOfficers);
router.put('/officers/:officerId/status', adminController.updateOfficerStatus);
router.delete('/officers/:officerId', adminController.deleteOfficer);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.put('/users/:userId/suspend', adminController.suspendUser);
router.put('/users/:userId/unsuspend', adminController.unsuspendUser);
router.delete('/users/:userId', adminController.deleteUser);

// Proposal management
router.get('/proposals', adminController.getAllProposals);
router.get('/proposals/:proposalId', adminController.getProposalDetails);
router.put('/proposals/:proposalId/status', adminController.updateProposalStatus);
router.delete('/proposals/:proposalId', adminController.deleteProposal);

// Proposal audit trail (NEW - implements PRD audit requirements)
router.get('/proposals/:proposalId/audit', votingController.getProposalAuditTrail);

// Admin override capabilities (NEW - implements PRD override requirements)
router.post('/proposals/:proposalId/override', adminController.overrideProposalDecision);

// Platform configuration (NEW - implements PRD configuration requirements)
router.get('/configuration', adminController.getPlatformConfiguration);
router.put('/configuration', adminController.updatePlatformConfiguration);

// Platform oversight
router.get('/stats', adminController.getPlatformStats);
router.get('/activity', adminController.getPlatformActivity);

export default router;