import * as adminService from './admin.service.js';

export const getAllSubmittedProposals = async (req, res, next) => {
  try {
    const proposals = await adminService.getAllSubmittedProposals();
    
    res.status(200).json({
      success: true,
      data: proposals
    });
  } catch (err) {
    next(err);
  }
};


export const getProposalDetails = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    
    if (!proposalId) {
      return res.status(400).json({ message: 'Proposal ID is required' });
    }
    
    const proposal = await adminService.getProposalDetails(proposalId);
    
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: proposal.id,
        title: proposal.eventTitle,
        description: proposal.description,
        status: proposal.status,
        documents: {
          budget: proposal.budgetFile || null,
          revenuePlan: proposal.revenuePlanFile || null,
          timeline: proposal.timeline || null
        }
      }
    });
  } catch (err) {
    next(err);
  }
};


export const submitVote = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const voteData = req.body;
    
    if (!proposalId) {
      return res.status(400).json({ message: 'Proposal ID is required' });
    }
    
    // Validate required fields
    if (!voteData.vote || !voteData.riskAssessment || !voteData.revenueComment) {
      return res.status(400).json({ message: 'Vote, riskAssessment, and revenueComment are required' });
    }
    
    // Validate vote value
    if (!['ACCEPT', 'REJECT'].includes(voteData.vote)) {
      return res.status(400).json({ message: 'Vote must be either ACCEPT or REJECT' });
    }
    
    const result = await adminService.submitVote(proposalId, voteData, req.user.userId);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};