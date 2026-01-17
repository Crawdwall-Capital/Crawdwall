import express from 'express';
import { createProposal } from './proposal.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('ORGANIZER'),
  createProposal
);

export default router;
