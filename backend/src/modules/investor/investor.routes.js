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
router.get('/opportunities/:id', investorController.getInvestmentOpportunityDetails);

// Investor portfolio
router.get('/portfolio', investorController.getInvestorPortfolio);

// Investment activity feed
router.get('/activity', investorController.getInvestmentActivity);

// Make investment
router.post('/invest', investorController.makeInvestment);

// Investment statistics
router.get('/stats', investorController.getInvestmentStats);

// Investor notifications
router.get('/notifications', investorController.getInvestorNotifications);

// Investment documents
router.get('/documents/:investmentId', investorController.getInvestmentDocuments);

// Investment transactions
router.get('/transactions', investorController.getInvestmentTransactions);

export default router;