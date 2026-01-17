import pool from '../../config/prisma.js';

export const createProposal = async (organizerId, data) => {
  const { eventTitle, description, expectedRevenue, timeline, pitchVideoUrl } = data;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create the proposal
    const proposalResult = await client.query(
      `INSERT INTO "Proposal" (id, "eventTitle", description, "expectedRevenue", timeline, "pitchVideoUrl", "organizerId", status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'SUBMITTED', NOW(), NOW())
       RETURNING *`,
      [eventTitle, description, expectedRevenue, timeline, pitchVideoUrl, organizerId]
    );

    const proposal = proposalResult.rows[0];

    // Create initial status history record
    await client.query(
      `INSERT INTO "StatusHistory" (id, status, "proposalId", "changedAt")
       VALUES (gen_random_uuid(), 'SUBMITTED', $1, NOW())`,
      [proposal.id]
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

export const getProposalsByOrganizer = async (organizerId) => {
  const result = await pool.query(
    `SELECT id, "eventTitle", status, "updatedAt"
     FROM "Proposal"
     WHERE "organizerId" = $1
     ORDER BY "createdAt" DESC`,
    [organizerId]
  );

  return result.rows;
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
