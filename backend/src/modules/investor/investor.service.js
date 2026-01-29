import pool from '../../config/prisma.js';

/**
 * GET INVESTMENT OPPORTUNITIES
 * Returns approved/funded proposals available for investment
 */
export const getInvestmentOpportunities = async (investorId) => {
  const result = await pool.query(`
    SELECT 
      p.id,
      p."eventTitle" as "eventName",
      'Event' as category,
      p.location,
      p."startDate",
      p."endDate", 
      p."budgetRequested" as "investmentAmount",
      p."minInvestment",
      p."maxInvestment",
      p."projectedReturn",
      p."riskLevel",
      p.duration,
      p.description,
      CASE 
        WHEN p.status = 'APPROVED' THEN 'Available'
        ELSE 'Coming Soon'
      END as status,
      p.featured,
      p."projectedReturn" as roi,
      u.name as "organizerName",
      u.email as "organizerEmail",
      p."currentInvestment",
      p."totalInvestmentNeeded"
    FROM "Proposal" p
    JOIN "User" u ON p."organizerId" = u.id
    WHERE p.status IN ('APPROVED', 'FUNDED')
    AND (p."totalInvestmentNeeded" IS NULL OR p."currentInvestment" < p."totalInvestmentNeeded")
    ORDER BY p.featured DESC, p."createdAt" DESC
  `);

  return result.rows.map(row => ({
    id: row.id,
    eventName: row.eventName,
    category: row.category,
    location: row.location || 'TBD',
    startDate: row.startDate,
    endDate: row.endDate,
    investmentAmount: row.investmentAmount?.toString() || '0',
    minInvestment: row.minInvestment?.toString() || '1000',
    projectedReturn: row.projectedReturn || '15-25%',
    riskLevel: row.riskLevel || 'Medium',
    duration: row.duration || '12 months',
    description: row.description,
    status: row.status,
    featured: row.featured || false,
    roi: row.roi || '18%',
    organizerName: row.organizerName,
    organizerEmail: row.organizerEmail,
    currentInvestment: row.currentInvestment || 0,
    totalInvestmentNeeded: row.totalInvestmentNeeded
  }));
};

/**
 * GET INVESTOR PORTFOLIO
 * Returns investor's current investments
 */
export const getInvestorPortfolio = async (investorId) => {
  const result = await pool.query(`
    SELECT 
      i.id,
      i."proposalId" as "eventId",
      p."eventTitle" as "eventName",
      i.amount as "investmentAmount",
      i."investmentDate",
      i."projectedReturn",
      i.status as "currentStatus",
      i.progress,
      u.id as "organizerId",
      u.name as "organizerName",
      u.email as "organizerEmail",
      p.status as "proposalStatus"
    FROM "Investment" i
    JOIN "Proposal" p ON i."proposalId" = p.id
    JOIN "User" u ON p."organizerId" = u.id
    WHERE i."investorId" = $1
    ORDER BY i."investmentDate" DESC
  `, [investorId]);

  return result.rows.map(row => ({
    id: row.id,
    eventId: row.eventId,
    eventName: row.eventName,
    investmentAmount: parseFloat(row.investmentAmount),
    investmentDate: row.investmentDate,
    projectedReturn: row.projectedReturn || '18%',
    currentStatus: row.currentStatus === 'ACTIVE' ? 'Active' : 'Completed',
    progress: row.progress || 0,
    organizerId: row.organizerId,
    organizerName: row.organizerName,
    organizerEmail: row.organizerEmail
  }));
};

/**
 * GET INVESTMENT ACTIVITY
 * Returns investor's activity feed
 */
export const getInvestmentActivity = async (investorId) => {
  const result = await pool.query(`
    SELECT 
      id,
      title,
      description,
      "createdAt" as date,
      type
    FROM "InvestmentActivity"
    WHERE "investorId" = $1
    ORDER BY "createdAt" DESC
    LIMIT 50
  `, [investorId]);

  return result.rows;
};

/**
 * MAKE INVESTMENT
 * Create a new investment in a proposal
 */
export const makeInvestment = async (investorId, proposalId, amount) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Convert amount to number to ensure proper data type
    const investmentAmount = parseFloat(amount);

    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      throw new Error('Invalid investment amount');
    }

    // 1. Verify proposal exists and is available for investment
    const proposalResult = await client.query(`
      SELECT id, "eventTitle", status, "minInvestment", "maxInvestment", 
             "currentInvestment", "totalInvestmentNeeded"
      FROM "Proposal" 
      WHERE id = $1 AND status IN ('APPROVED', 'FUNDED')
    `, [proposalId]);

    if (proposalResult.rows.length === 0) {
      throw new Error('Proposal not found or not available for investment');
    }

    const proposal = proposalResult.rows[0];

    // 2. Validate investment amount
    const minInvestment = parseFloat(proposal.minInvestment) || 1000;
    const maxInvestment = parseFloat(proposal.maxInvestment);

    if (investmentAmount < minInvestment) {
      throw new Error(`Minimum investment amount is ${minInvestment}`);
    }

    if (maxInvestment && investmentAmount > maxInvestment) {
      throw new Error(`Maximum investment amount is ${maxInvestment}`);
    }

    // 3. Check if investor already invested in this proposal
    const existingInvestment = await client.query(`
      SELECT id FROM "Investment" 
      WHERE "investorId" = $1 AND "proposalId" = $2
    `, [investorId, proposalId]);

    if (existingInvestment.rows.length > 0) {
      throw new Error('You have already invested in this proposal');
    }

    // 4. Create investment record
    const investmentResult = await client.query(`
      INSERT INTO "Investment" (
        id, "investorId", "proposalId", amount, "investmentDate", 
        status, "projectedReturn", progress, "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text, $1, $2, $3, NOW(), 
        'ACTIVE', '18%', 0, NOW(), NOW()
      )
      RETURNING *
    `, [investorId, proposalId, investmentAmount]);

    const investment = investmentResult.rows[0];

    // 5. Update proposal's current investment amount
    await client.query(`
      UPDATE "Proposal" 
      SET "currentInvestment" = COALESCE("currentInvestment", 0) + $1,
          "updatedAt" = NOW()
      WHERE id = $2
    `, [investmentAmount, proposalId]);

    // 6. Create activity record
    await client.query(`
      INSERT INTO "InvestmentActivity" (
        id, "investorId", "investmentId", "proposalId", 
        title, description, type, amount
      )
      VALUES (
        gen_random_uuid()::text, $1, $2, $3,
        $4, $5, 'investment', $6
      )
    `, [
      investorId,
      investment.id,
      proposalId,
      'Investment Made',
      `Successfully invested $${investmentAmount} in ${proposal.eventTitle}`,
      investmentAmount
    ]);

    await client.query('COMMIT');

    return {
      investmentId: investment.id,
      proposalId: proposalId,
      amount: investmentAmount,
      investmentDate: investment.investmentDate,
      status: 'Active'
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * GET INVESTMENT STATISTICS
 * Returns investor's investment summary
 */
export const getInvestmentStats = async (investorId) => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as "totalInvestments",
      COALESCE(SUM(amount), 0) as "totalInvested",
      COALESCE(AVG(progress), 0) as "averageProgress",
      COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as "activeInvestments",
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as "completedInvestments"
    FROM "Investment"
    WHERE "investorId" = $1
  `, [investorId]);

  return result.rows[0];
};

/**
 * GET INVESTMENT OPPORTUNITY DETAILS
 * Returns detailed information about a specific investment opportunity
 */
export const getInvestmentOpportunityDetails = async (investorId, proposalId) => {
  const result = await pool.query(`
    SELECT 
      p.id,
      p."eventTitle" as "eventName",
      p.description,
      p."eventType",
      p."budgetRequested",
      p."expectedRevenue",
      p."eventDuration",
      p.timeline,
      p."revenuePlan",
      p."targetAudience",
      p.location,
      p."startDate",
      p."endDate",
      p."minInvestment",
      p."maxInvestment",
      p."projectedReturn",
      p."riskLevel",
      p."currentInvestment",
      p."totalInvestmentNeeded",
      p.featured,
      p.status,
      u.name as "organizerName",
      u.email as "organizerEmail",
      u."phoneNumber" as "organizerPhone",
      -- Check if investor already invested
      CASE WHEN i.id IS NOT NULL THEN true ELSE false END as "alreadyInvested",
      i.amount as "investedAmount",
      i."investmentDate"
    FROM "Proposal" p
    JOIN "User" u ON p."organizerId" = u.id
    LEFT JOIN "Investment" i ON p.id = i."proposalId" AND i."investorId" = $2
    WHERE p.id = $1 AND p.status IN ('APPROVED', 'FUNDED')
  `, [proposalId, investorId]);

  if (result.rows.length === 0) {
    throw new Error('Investment opportunity not found or not available');
  }

  const opportunity = result.rows[0];

  return {
    id: opportunity.id,
    eventName: opportunity.eventName,
    description: opportunity.description,
    eventType: opportunity.eventType,
    budgetRequested: parseFloat(opportunity.budgetRequested),
    expectedRevenue: parseFloat(opportunity.expectedRevenue),
    eventDuration: opportunity.eventDuration,
    timeline: opportunity.timeline,
    revenuePlan: opportunity.revenuePlan,
    targetAudience: opportunity.targetAudience,
    location: opportunity.location || 'TBD',
    startDate: opportunity.startDate,
    endDate: opportunity.endDate,
    minInvestment: parseFloat(opportunity.minInvestment) || 1000,
    maxInvestment: opportunity.maxInvestment ? parseFloat(opportunity.maxInvestment) : null,
    projectedReturn: opportunity.projectedReturn || '15-25%',
    riskLevel: opportunity.riskLevel || 'Medium',
    currentInvestment: parseFloat(opportunity.currentInvestment) || 0,
    totalInvestmentNeeded: opportunity.totalInvestmentNeeded ? parseFloat(opportunity.totalInvestmentNeeded) : null,
    featured: opportunity.featured || false,
    status: opportunity.status,
    organizer: {
      name: opportunity.organizerName,
      email: opportunity.organizerEmail,
      phone: opportunity.organizerPhone
    },
    investment: {
      alreadyInvested: opportunity.alreadyInvested,
      amount: opportunity.investedAmount ? parseFloat(opportunity.investedAmount) : null,
      date: opportunity.investmentDate
    }
  };
};

/**
 * GET INVESTOR NOTIFICATIONS
 * Returns investor's notifications
 */
export const getInvestorNotifications = async (investorId) => {
  const result = await pool.query(`
    SELECT 
      ia.id,
      ia.title,
      ia.description,
      ia."createdAt" as date,
      ia.type,
      p."eventTitle" as "eventName",
      'unread' as status
    FROM "InvestmentActivity" ia
    LEFT JOIN "Proposal" p ON ia."proposalId" = p.id
    WHERE ia."investorId" = $1
    ORDER BY ia."createdAt" DESC
    LIMIT 20
  `, [investorId]);

  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    type: row.type,
    eventName: row.eventName,
    status: row.status
  }));
};

/**
 * GET INVESTMENT DOCUMENTS
 * Returns documents related to a specific investment
 */
export const getInvestmentDocuments = async (investorId, investmentId) => {
  // First verify the investment belongs to this investor
  const investmentCheck = await pool.query(`
    SELECT i.id, p."eventTitle", p."supportingDocuments"
    FROM "Investment" i
    JOIN "Proposal" p ON i."proposalId" = p.id
    WHERE i.id = $1 AND i."investorId" = $2
  `, [investmentId, investorId]);

  if (investmentCheck.rows.length === 0) {
    throw new Error('Investment not found or access denied');
  }

  const investment = investmentCheck.rows[0];

  // Return available documents
  return {
    investmentId: investmentId,
    eventName: investment.eventTitle,
    documents: [
      {
        id: 'investment-agreement',
        name: 'Investment Agreement',
        type: 'PDF',
        url: `/api/investor/documents/${investmentId}/agreement`,
        description: 'Legal investment agreement document'
      },
      {
        id: 'proposal-documents',
        name: 'Proposal Supporting Documents',
        type: 'Various',
        url: `/api/investor/documents/${investmentId}/proposal`,
        description: 'Original proposal supporting documents'
      }
    ]
  };
};

/**
 * GET INVESTMENT TRANSACTIONS
 * Returns detailed transaction history for investor
 */
export const getInvestmentTransactions = async (investorId) => {
  const result = await pool.query(`
    SELECT 
      i.id as "transactionId",
      'INVESTMENT' as type,
      i.amount,
      i."investmentDate" as date,
      'COMPLETED' as status,
      p."eventTitle" as "eventName",
      p.id as "proposalId",
      i."projectedReturn",
      i.progress
    FROM "Investment" i
    JOIN "Proposal" p ON i."proposalId" = p.id
    WHERE i."investorId" = $1
    ORDER BY i."investmentDate" DESC
  `, [investorId]);

  return result.rows.map(row => ({
    transactionId: row.transactionId,
    type: row.type,
    amount: parseFloat(row.amount),
    date: row.date,
    status: row.status,
    eventName: row.eventName,
    proposalId: row.proposalId,
    projectedReturn: row.projectedReturn,
    progress: row.progress
  }));
};