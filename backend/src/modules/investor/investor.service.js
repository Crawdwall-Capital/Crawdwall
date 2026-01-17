import pool from '../../config/prisma.js';

/**
 * Get investment opportunities
 */
export const getInvestmentOpportunities = async (eventType = null) => {
  let query = `
    SELECT p.*, 
           u.id as "organizer_id", 
           u.name as "organizer_name", 
           u.email as "organizer_email"
    FROM "Proposal" p
    JOIN "User" u ON p."organizerId" = u.id
    WHERE p.status = 'APPROVED'
  `;

  const params = [];

  // Add eventType filter if provided
  if (eventType) {
    query += ` AND p."eventType" = $1`;
    params.push(eventType);
  }

  query += ` ORDER BY p."expectedRevenue" DESC, p."createdAt" DESC`;

  const result = await pool.query(query, params);

  return result.rows.map(row => ({
    ...row,
    organizer: {
      id: row.organizer_id,
      name: row.organizer_name,
      email: row.organizer_email
    }
  }));
};

/**
 * Get investment opportunity by ID
 */
export const getInvestmentOpportunityById = async (proposalId) => {
  const result = await pool.query(
    `SELECT p.*, 
            u.id as "organizer_id", 
            u.name as "organizer_name", 
            u.email as "organizer_email"
     FROM "Proposal" p
     JOIN "User" u ON p."organizerId" = u.id
     WHERE p.id = $1`,
    [proposalId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    organizer: {
      id: row.organizer_id,
      name: row.organizer_name,
      email: row.organizer_email
    }
  };
};

/**
 * Get investor's investments
 */
export const getInvestorInvestments = async (investorId) => {
  // For now, return placeholder data
  // In a future implementation, this would query an Investments table
  return [];
};

/**
 * Get escrow activity
 */
export const getEscrowActivity = async (investorId) => {
  // For now, return placeholder data
  // In a future implementation, this would query an Escrow table
  return {
    balance: 0,
    transactions: [],
    pending: 0
  };
};