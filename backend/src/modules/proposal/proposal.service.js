import pool from '../../config/prisma.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * CREATE PROPOSAL (Enhanced for PRD compliance with all required fields)
 * Supports DRAFT and SUBMITTED states
 */
export const createProposal = async (organizerId, data, isDraft = false) => {
  const {
    eventTitle,
    description,
    eventType,
    budgetRequested,
    expectedRevenue,
    eventDuration,
    timeline,
    revenuePlan,
    targetAudience,
    pitchVideoUrl,
    supportingDocuments = []
  } = data;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Determine initial status based on isDraft flag
    const initialStatus = isDraft ? 'DRAFT' : 'SUBMITTED';

    // Create the proposal with all new fields
    const proposalResult = await client.query(
      `INSERT INTO "Proposal" (
        id, "eventTitle", description, "eventType", "budgetRequested", 
        "expectedRevenue", "eventDuration", timeline, "revenuePlan", 
        "targetAudience", "pitchVideoUrl", "supportingDocuments", 
        "organizerId", status, "createdAt", "updatedAt"
      )
       VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
       )
       RETURNING *`,
      [
        eventTitle,
        description,
        eventType,
        budgetRequested,
        expectedRevenue,
        eventDuration,
        timeline,
        revenuePlan,
        targetAudience,
        pitchVideoUrl,
        JSON.stringify(supportingDocuments), // Store file metadata as JSON
        organizerId,
        initialStatus
      ]
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
      [uuidv4(), proposal.id, 'PROPOSAL_CREATED', organizerId, 'ORGANIZER', JSON.stringify({
        initialStatus,
        eventType,
        budgetRequested,
        eventDuration,
        documentsCount: supportingDocuments.length
      })]
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
 * GET PROPOSALS BY ORGANIZER
 */
export const getProposalsByOrganizer = async (organizerId) => {
  const result = await pool.query(
    `SELECT id, "eventTitle", "eventType", "budgetRequested", "expectedRevenue", status, "createdAt", "updatedAt"
     FROM "Proposal"
     WHERE "organizerId" = $1
     ORDER BY "createdAt" DESC`,
    [organizerId]
  );

  return result.rows;
};

/**
 * GET PROPOSAL BY ID
 */
export const getProposalById = async (proposalId, organizerId) => {
  const result = await pool.query(
    `SELECT * FROM "Proposal"
     WHERE id = $1 AND "organizerId" = $2`,
    [proposalId, organizerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Proposal not found');
  }

  return result.rows[0];
};

/**
 * UPDATE PROPOSAL
 */
export const updateProposal = async (proposalId, organizerId, updateData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if proposal exists and belongs to organizer
    const proposalResult = await client.query(
      'SELECT id, status FROM "Proposal" WHERE id = $1 AND "organizerId" = $2',
      [proposalId, organizerId]
    );

    if (proposalResult.rows.length === 0) {
      throw new Error('Proposal not found');
    }

    const proposal = proposalResult.rows[0];

    // Only allow updates to DRAFT proposals
    if (proposal.status !== 'DRAFT') {
      throw new Error('Can only update draft proposals');
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'supportingDocuments') {
        updateFields.push(`"supportingDocuments" = $${paramCount}`);
        updateValues.push(JSON.stringify(value));
      } else if (key !== 'id' && key !== 'organizerId' && key !== 'createdAt') {
        updateFields.push(`"${key}" = $${paramCount}`);
        updateValues.push(value);
      }
      paramCount++;
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(proposalId, organizerId);

    const updateQuery = `
      UPDATE "Proposal" 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount} AND "organizerId" = $${paramCount + 1}
      RETURNING *
    `;

    const updatedResult = await client.query(updateQuery, updateValues);

    await client.query('COMMIT');
    return updatedResult.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * SUBMIT PROPOSAL (convert from draft)
 */
export const submitProposal = async (proposalId, organizerId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if proposal exists and is a draft
    const proposalResult = await client.query(
      'SELECT id, status FROM "Proposal" WHERE id = $1 AND "organizerId" = $2',
      [proposalId, organizerId]
    );

    if (proposalResult.rows.length === 0) {
      throw new Error('Proposal not found');
    }

    const proposal = proposalResult.rows[0];

    if (proposal.status !== 'DRAFT') {
      throw new Error('Can only submit draft proposals');
    }

    // Update status to SUBMITTED
    const updatedResult = await client.query(
      `UPDATE "Proposal" 
       SET status = 'SUBMITTED', "updatedAt" = NOW()
       WHERE id = $1
       RETURNING *`,
      [proposalId]
    );

    // Log status change
    await client.query(
      `INSERT INTO "StatusHistory" (id, status, "proposalId", "changedAt")
       VALUES (gen_random_uuid(), 'SUBMITTED', $1, NOW())`,
      [proposalId]
    );

    await client.query('COMMIT');
    return updatedResult.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * GET PROPOSAL HISTORY
 */
export const getProposalHistory = async (proposalId, organizerId) => {
  // First verify the proposal belongs to the organizer
  const proposalResult = await pool.query(
    'SELECT id FROM "Proposal" WHERE id = $1 AND "organizerId" = $2',
    [proposalId, organizerId]
  );

  if (proposalResult.rows.length === 0) {
    throw new Error('Proposal not found');
  }

  const result = await pool.query(
    `SELECT status, "changedAt", notes
     FROM "StatusHistory"
     WHERE "proposalId" = $1
     ORDER BY "changedAt" ASC`,
    [proposalId]
  );

  return result.rows;
};