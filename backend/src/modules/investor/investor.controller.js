import * as investorService from './investor.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET INVESTMENT OPPORTUNITIES
 * GET /investor/opportunities
 */
export const getInvestmentOpportunities = async (req, res) => {
  try {
    const investorId = req.user.userId;
    const opportunities = await investorService.getInvestmentOpportunities(investorId);

    return successResponse(res, opportunities, 200);
  } catch (error) {
    console.error('Get investment opportunities error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET INVESTOR PORTFOLIO
 * GET /investor/portfolio
 */
export const getInvestorPortfolio = async (req, res) => {
  try {
    const investorId = req.user.userId;
    const portfolio = await investorService.getInvestorPortfolio(investorId);

    return successResponse(res, portfolio, 200);
  } catch (error) {
    console.error('Get investor portfolio error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET INVESTMENT ACTIVITY
 * GET /investor/activity
 */
export const getInvestmentActivity = async (req, res) => {
  try {
    const investorId = req.user.userId;
    const activity = await investorService.getInvestmentActivity(investorId);

    return successResponse(res, activity, 200);
  } catch (error) {
    console.error('Get investment activity error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * MAKE INVESTMENT
 * POST /investor/invest
 */
export const makeInvestment = async (req, res) => {
  try {
    const investorId = req.user.userId;
    const { proposalId, amount } = req.body;

    if (!proposalId || !amount) {
      return errorResponse(res, 'Proposal ID and amount are required', 400);
    }

    if (amount <= 0) {
      return errorResponse(res, 'Investment amount must be greater than 0', 400);
    }

    const investment = await investorService.makeInvestment(investorId, proposalId, amount);

    return successResponse(res, investment, 201);
  } catch (error) {
    console.error('Make investment error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET INVESTMENT OPPORTUNITY DETAILS
 * GET /investor/opportunities/:id
 */
export const getInvestmentOpportunityDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const investorId = req.user.userId;

    const opportunity = await investorService.getInvestmentOpportunityDetails(investorId, id);

    return successResponse(res, opportunity, 200);
  } catch (error) {
    console.error('Get investment opportunity details error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET INVESTOR NOTIFICATIONS
 * GET /investor/notifications
 */
export const getInvestorNotifications = async (req, res) => {
  try {
    const investorId = req.user.userId;
    const notifications = await investorService.getInvestorNotifications(investorId);

    return successResponse(res, notifications, 200);
  } catch (error) {
    console.error('Get investor notifications error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET INVESTMENT DOCUMENTS
 * GET /investor/documents/:investmentId
 */
export const getInvestmentDocuments = async (req, res) => {
  try {
    const { investmentId } = req.params;
    const investorId = req.user.userId;

    const documents = await investorService.getInvestmentDocuments(investorId, investmentId);

    return successResponse(res, documents, 200);
  } catch (error) {
    console.error('Get investment documents error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET INVESTMENT TRANSACTIONS
 * GET /investor/transactions
 */
export const getInvestmentTransactions = async (req, res) => {
  try {
    const investorId = req.user.userId;
    const transactions = await investorService.getInvestmentTransactions(investorId);

    return successResponse(res, transactions, 200);
  } catch (error) {
    console.error('Get investment transactions error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * GET INVESTMENT STATISTICS
 * GET /investor/stats
 */
export const getInvestmentStats = async (req, res) => {
  try {
    const investorId = req.user.userId;
    const stats = await investorService.getInvestmentStats(investorId);

    return successResponse(res, stats, 200);
  } catch (error) {
    console.error('Get investment stats error:', error);
    return errorResponse(res, error.message, 400);
  }
};