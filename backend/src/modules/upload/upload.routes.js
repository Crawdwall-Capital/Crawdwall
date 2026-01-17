import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { uploadMultiple, generateFileUrl, cleanupFiles } from '../../config/upload.js';
import * as uploadController from './upload.controller.js';

const router = express.Router();

// Upload files for a proposal
// This endpoint handles uploading pitch video, budget file, and revenue plan file
router.post(
  '/proposals/:proposalId/files',
  authenticate,
  authorize('ORGANIZER'),
  uploadMultiple([
    { name: 'pitchVideo', maxCount: 1 },
    { name: 'budgetFile', maxCount: 1 },
    { name: 'revenuePlanFile', maxCount: 1 }
  ]),
  uploadController.uploadProposalFiles
);

// Get uploaded files for a proposal
router.get(
  '/proposals/:proposalId/files',
  authenticate,
  authorize('ORGANIZER'),
  uploadController.getProposalFiles
);

// Delete a specific file
router.delete(
  '/proposals/:proposalId/files/:fileType',
  authenticate,
  authorize('ORGANIZER'),
  uploadController.deleteProposalFile
);

// Serve uploaded files (public access)
router.use('/uploads', express.static('uploads'));

export default router;