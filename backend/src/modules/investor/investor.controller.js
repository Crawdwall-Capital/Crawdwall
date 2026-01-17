
import * as investorService from './investor.service.js';

export const getInvestmentOpportunities = async (req, res, next) => {
  try {
    const { eventType } = req.query;
    const opportunities = await investorService.getInvestmentOpportunities(eventType);
    
    // Format response to match the API specification
    const formattedOpportunities = opportunities.map(opportunity => ({
      proposalId: opportunity.id,
      title: opportunity.eventTitle,
      eventType: opportunity.eventType || 'EVENT', // Default to EVENT if not specified
      eventDate: opportunity.eventDate || null,
      documentUrl: opportunity.pitchVideoUrl || opportunity.budgetFile || opportunity.revenuePlanFile || null
    }));
    
    res.status(200).json({
      success: true,
      data: formattedOpportunities
    });
  } catch (err) {
    next(err);
  }
};


export const getInvestmentOpportunity = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    
    if (!proposalId) {
      return res.status(400).json({ message: 'Proposal ID is required' });
    }
    
    const opportunity = await investorService.getInvestmentOpportunityById(proposalId);
    
    if (!opportunity) {
      return res.status(404).json({ message: 'Investment opportunity not found' });
    }
    
    if (opportunity.status !== 'APPROVED') {
      return res.status(404).json({ message: 'Investment opportunity not found or not approved' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        proposalId: opportunity.id,
        title: opportunity.eventTitle,
        eventType: opportunity.eventType || 'EVENT',
        eventDate: opportunity.eventDate || null,
        documentUrl: opportunity.pitchVideoUrl || opportunity.budgetFile || opportunity.revenuePlanFile || null,
        status: opportunity.status
      }
    });
  } catch (err) {
    next(err);
  }
};


export const getInvestments = async (req, res, next) => {
  try {
    // For now, we'll return an empty array since the investment tracking model isn't implemented yet
    // In a future implementation, this would query a Investments table
    const investments = await investorService.getInvestorInvestments(req.user.userId);
    
    res.status(200).json({
      success: true,
      data: investments
    });
  } catch (err) {
    next(err);
  }
};


export const getEscrowActivity = async (req, res, next) => {
  try {
    // For now, we'll return placeholder data since the escrow system isn't implemented yet
    // In a future implementation, this would query an Escrow table
    const escrowActivity = await investorService.getEscrowActivity(req.user.userId);
    
    res.status(200).json({
      success: true,
      data: escrowActivity
    });
  } catch (err) {
    next(err);
  }
};