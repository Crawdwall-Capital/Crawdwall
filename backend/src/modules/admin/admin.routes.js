import express from 'express';
import * as adminController from './admin.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// Admin OTP authentication (no auth required)
router.post('/request-otp', adminController.requestAdminOTP);
router.post('/verify-otp', adminController.verifyAdminOTP);

// Admin functions (require admin authentication)
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// Officer management
router.post('/officers', adminController.createOfficer);
router.get('/officers', adminController.getAllOfficers);
router.put('/officers/:officerId/status', adminController.updateOfficerStatus);
router.delete('/officers/:officerId', adminController.deleteOfficer);

// Platform statistics
router.get('/stats', adminController.getPlatformStats);

export default router;