import pool from '../../config/prisma.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * CREATE PROPOSAL (Enhanced for PRD compliance)
 * Supports DRAFT and SUBMITTED states
 */
export const createProposal = async (organizerId, data, isDraft = false) => {
  const { eventTitle, description, expectedRevenue, timeline, pitchVideoUrl } = data;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Determine initial status based on isDraft flag
    const initialStatus = isDraft ? 'DRAFT' : 'SUBMITTED';

    // Create the proposal
    const proposalResult = await client.query(
      `INSERT INTO "Proposal" (id, "eventTitle", description, "expectedRevenue", timeline, "pitchVideoUrl", "organizerId", status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [eventTitle, description, expectedRevenue, timeline, pitchVideoUrl, organizerId, initialStatus]
    );

    const proposal = proposalResult.rows[0];

    // Create initial status history record
    await client.query(
      `INSERT INTO "StatusHistory" (id, status, "proposalId", "changedAt")
       VALUES (gen_random_uuid(), $1, $2, NOW())`,
      [initialStatus, proposal.id]
    );

    // Log proposal creation in audit trail
    await client.query(
      `INSERT INTO "ProposalAudit" (id, "proposalId", action, "performedBy", "performedByRole", details, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [uuidv4(), proposal.id, 'PROPOSAL_CREATED', organizerId, 'ORGANIZER', JSON.stringify({ initialStatus })]
    );

    await client.query('COMMIT');

    return proposal;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * UPDATE PROPOSAL (For draft editing)
 */
export const updateProposal = async (proposalId, organizerId, data) => {
  const { eventTitle, description, expectedRevenue, timeline, pitchVideoUrl } = data;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if proposal exists and belongs to organizer
    const existingResult = await client.query(
      'SELECT id, status FROM "Proposal" WHERE id = $1 AND "organizerId" = $2',
      [proposalId, organizerId]
    );

    if (existingResult.rows.length === 0) {
      throw new Error('Proposal not found or access denied');
    }

    const existing = existingResult.rows[0];

    // Only allow editing of DRAFT proposals
    if (existing.status !== 'DRAFT') {
      throw new Error('Can only edit proposals in DRAFT status');
    }

    // Update the proposal
    const proposalResult = await client.query(
      `UPDATE "Proposal" 
       SET "eventTitle" = $1, description = $2, "expectedRevenue" = $3, 
           timeline = $4, "pitchVideoUrl" = $5, "updatedAt" = NOW()
       WHERE id = $6
       RETURNING *`,
      [eventTitle, description, expectedRevenue, timeline, pitchVideoUrl, proposalId]
    );

    // Log the update
    await client.query(
      `INSERT INTO "ProposalAudit" (id, "proposalId", action, "performedBy", "performedByRole", details, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [uuidv4(), proposalId, 'PROPOSAL_UPDATED', organizerId, 'ORGANIZER', JSON.stringify({ fields: Object.keys(data) })]
    );

    await client.query('COMMIT');

    return proposalResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * SUBMIT PROPOSAL (Convert from DRAFT to SUBMITTED)
 */
export const submitProposal = async (proposalId, organizerId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if proposal exists and belongs to organizer
    const existingResult = await client.query(
      'SELECT id, status FROM "Proposal" WHERE id = $1 AND "organizerId" = $2',
      [proposalId, organizerId]
    );

    if (existingResult.rows.length === 0) {
      throw new Error('Proposal not found or access denied');
    }

    const existing = existingResult.rows[0];

    // Only allow submitting DRAFT proposals
    if (existing.status !== 'DRAFT') {
      throw new Error('Can only submit proposals in DRAFT status');
    }

    // Update status to SUBMITTED
    const proposalResult = await client.query(
      `UPDATE "Proposal" 
       SET status = 'SUBMITTED', "updatedAt" = NOW()
       WHERE id = $1
       RETURNING *`,
      [proposalId]
    );

    // Add status history
    await client.query(
      `INSERT INTO "StatusHistory" (id, status, "proposalId", "changedAt")
       VALUES (gen_random_uuid(), 'SUBMITTED', $1, NOW())`,
      [proposalId]
    );

    // Log the submission
    await client.query(
      `INSERT INTO "ProposalAudit" (id, "proposalId", action, "performedBy", "performedByRole", details, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [uuidv4(), proposalId, 'PROPOSAL_SUBMITTED', organizerId, 'ORGANIZER', JSON.stringify({ oldStatus: 'DRAFT', newStatus: 'SUBMITTED' })]
    );

    await client.query('COMMIT');

    return proposalResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * GET PROPOSALS BY ORGANIZER (Enhanced with voting info)
 */
export const getProposalsByOrganizer = async (organizerId) => {
  const result = await pool.query(
    `SELECT p.id, p."eventTitle", p.status, p."updatedAt", p."createdAt",
            COALESCE(v.vote_count, 0) as vote_count,
            COALESCE(v.accept_votes, 0) as accept_votes
     FROM "Proposal" p
     LEFT JOIN (
       SELECT "proposalId", 
              COUNT(*) as vote_count,
              COUNT(CASE WHEN decision = 'ACCEPT' THEN 1 END) as accept_votes
       FROM "Vote"
       GROUP BY "proposalId"
     ) v ON p.id = v."proposalId"
     WHERE p."organizerId" = $1
     ORDER BY p."createdAt" DESC`,
    [organizerId]
  );

  return result.rows;
};

/**
 * GET PROPOSALS FOR OFFICER REVIEW (Only SUBMITTED and UNDER_REVIEW)
 */
export const getProposalsForReview = async () => {
  const result = await pool.query(
    `SELECT p.id, p."eventTitle", p.description, p."expectedRevenue", 
            p.timeline, p.status, p."createdAt", p."updatedAt",
            u.name as "organizerName", u.email as "organizerEmail",
            COALESCE(v.vote_count, 0) as vote_count,
            COALESCE(v.accept_votes, 0) as accept_votes,
            COALESCE(v.reject_votes, 0) as reject_votes
     FROM "Proposal" p
     JOIN "User" u ON p."organizerId" = u.id
     LEFT JOIN (
       SELECT "proposalId", 
              COUNT(*) as vote_count,
              COUNT(CASE WHEN decision = 'ACCEPT' THEN 1 END) as accept_votes,
              COUNT(CASE WHEN decision = 'REJECT' THEN 1 END) as reject_votes
       FROM "Vote"
       GROUP BY "proposalId"
     ) v ON p.id = v."proposalId"
     WHERE p.status IN ('SUBMITTED', 'UNDER_REVIEW')
     ORDER BY p."createdAt" ASC`,
    []
  );

  return result.rows;
};

/**
 * GET PROPOSAL DETAILS (Enhanced with voting and audit info)
 */
export const getProposalDetails = async (proposalId, requestingUserId = null, requestingUserRole = null) => {
  const client = await pool.connect();

  try {
    // Get basic proposal info
    const proposalResult = await client.query(
      `SELECT p.*, u.name as "organizerName", u.email as "organizerEmail"
       FROM "Proposal" p
       JOIN "User" u ON p."organizerId" = u.id
       WHERE p.id = $1`,
      [proposalId]
    );

    if (proposalResult.rows.length === 0) {
      throw new Error('Proposal not found');
    }

    const proposal = proposalResult.rows[0];

    // Get voting summary
    const votingResult = await client.query(
      `SELECT 
         COUNT(*) as total_votes,
         COUNT(CASE WHEN decision = 'ACCEPT' THEN 1 END) as accept_votes,
         COUNT(CASE WHEN decision = 'REJECT' THEN 1 END) as reject_votes
       FROM "Vote" 
       WHERE "proposalId" = $1`,
      [proposalId]
    );

    proposal.votingSummary = votingResult.rows[0];

    // Get status history
    const historyResult = await client.query(
      `SELECT status, "changedAt"
       FROM "StatusHistory"
       WHERE "proposalId" = $1
       ORDER BY "changedAt" ASC`,
      [proposalId]
    );

    proposal.statusHistory = historyResult.rows;

    // If requesting user is an officer, include additional voting details
    if (requestingUserRole === 'OFFICER') {
      // Check if officer has voted
      const officerVoteResult = await client.query(
        'SELECT decision, "riskAssessment", "revenueComment", notes, "createdAt" FROM "Vote" WHERE "proposalId" = $1 AND "officerId" = $2',
        [proposalId, requestingUserId]
      );

      proposal.officerVote = officerVoteResult.rows[0] || null;
      proposal.hasVoted = officerVoteResult.rows.length > 0;

      // If officer has voted, show all votes (PRD requirement)
      if (proposal.hasVoted) {
        const allVotesResult = await client.query(
          `SELECT v.decision, v."riskAssessment", v."revenueComment", v.notes, v."createdAt",
                  o.name as "officerName"
           FROM "Vote" v
           JOIN "Officer" o ON v."officerId" = o.id
           WHERE v."proposalId" = $1
           ORDER BY v."createdAt" ASC`,
          [proposalId]
        );

        proposal.allVotes = allVotesResult.rows;
      }
    }

    return proposal;

  } finally {
    client.release();
  }
};

export const getProposalStatusHistory = async (proposalId) => {
  const result = await pool.query(
    `SELECT status, "changedAt"
     FROM "StatusHistory"
     WHERE "proposalId" = $1
     ORDER BY "changedAt" ASC`,
    [proposalId]
  );

  return result.rows;
};
