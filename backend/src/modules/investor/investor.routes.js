import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { 
  getInvestmentOpportunities, 
  getInvestmentOpportunity, 
  getInvestments,
  getEscrowActivity 
} from './investor.controller.js';

const router = express.Router();

// View all approved investment opportunities - only for investors
router.get(
  '/opportunities',
  authenticate,
  authorize('INVESTOR'),
  getInvestmentOpportunities
);

// View specific investment opportunity - only for investors
router.get(
  '/opportunities/:proposalId',
  authenticate,
  authorize('INVESTOR'),
  getInvestmentOpportunity
);

// View investor's investments - only for investors
router.get(
  '/investments',
  authenticate,
  authorize('INVESTOR'),
  getInvestments
);

// View escrow activity - only for investors
router.get(
  '/escrow',
  authenticate,
  authorize('INVESTOR'),
  getEscrowActivity
);

export default router;