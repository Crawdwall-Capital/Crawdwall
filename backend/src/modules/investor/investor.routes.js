import express from 'express';
import * as investorController from './investor.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// All investor routes require authentication and INVESTOR role
router.use(authenticate);
router.use(requireRole(['INVESTOR']));

// Investment opportunities
router.get('/opportunities', investorController.getInvestmentOpportunities);

// Investor portfolio
router.get('/portfolio', investorController.getInvestorPortfolio);

// Investment activity feed
router.get('/activity', investorController.getInvestmentActivity);

// Make investment
router.post('/invest', investorController.makeInvestment);

// Investment statistics
router.get('/stats', investorController.getInvestmentStats);

export default router;