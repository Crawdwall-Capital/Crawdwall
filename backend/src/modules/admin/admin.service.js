import pool from '../../config/prisma.js';

/**
 * Get all submitted proposals
 */
export const getAllSubmittedProposals = async () => {
  const result = await pool.query(
    `SELECT id, "eventTitle", status
     FROM "Proposal"
     WHERE status = 'SUBMITTED'
     ORDER BY "createdAt" DESC`
  );

  return result.rows;
};

/**
 * Get proposal details by ID and update status to UNDER_REVIEW
 */
export const getProposalDetails = async (proposalId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update status to IN_REVIEW
    await client.query(
      `UPDATE "Proposal" SET status = 'IN_REVIEW', "updatedAt" = NOW() WHERE id = $1`,
      [proposalId]
    );

    // Fetch the proposal with details
    const result = await client.query(
      `SELECT p.*, 
              u.id as "organizer_id", 
              u.name as "organizer_name", 
              u.email as "organizer_email"
       FROM "Proposal" p
       JOIN "User" u ON p."organizerId" = u.id
       WHERE p.id = $1`,
      [proposalId]
    );

    await client.query('COMMIT');

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
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Submit vote and review for a proposal
 */
export const submitVote = async (proposalId, voteData, adminUserId) => {
  const { vote, riskAssessment, revenueComment, notes } = voteData;

  // First, update the proposal status based on the vote
  let newStatus = '';
  if (vote === 'ACCEPT') {
    newStatus = 'APPROVED';
  } else if (vote === 'REJECT') {
    newStatus = 'REJECTED';
  } else {
    throw new Error('Invalid vote type. Must be ACCEPT or REJECT');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update the proposal status
    await client.query(
      `UPDATE "Proposal" SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
      [newStatus, proposalId]
    );

    // Create the review/vote record
    await client.query(
      `INSERT INTO "Review" (id, "proposalId", "reviewerId", vote, "riskAssessment", "revenueComment", notes, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [proposalId, adminUserId, vote, riskAssessment, revenueComment, notes]
    );

    // Count accept votes for this proposal
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM "Review" WHERE "proposalId" = $1 AND vote = 'ACCEPT'`,
      [proposalId]
    );

    await client.query('COMMIT');

    return {
      currentAcceptVotes: parseInt(countResult.rows[0].count),
      proposalStatus: newStatus
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};