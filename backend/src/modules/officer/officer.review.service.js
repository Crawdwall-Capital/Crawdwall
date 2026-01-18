import pool from '../../config/prisma.js';

/**
 * GET ALL SUBMITTED PROPOSALS (for Officers to review)
 */
export const getSubmittedProposals = async () => {
    const result = await pool.query(
        `SELECT p.id, p."eventTitle", p.description, p."expectedRevenue", 
            p.timeline, p.status, p."createdAt",
            u.name as "organizerName", u.email as "organizerEmail"
     FROM "Proposal" p
     JOIN "User" u ON p."organizerId" = u.id
     WHERE p.status = 'SUBMITTED'
     ORDER BY p."createdAt" DESC`
    );

    return result.rows;
};

/**
 * GET PROPOSAL DETAILS FOR REVIEW (Officer function)
 */
export const getProposalForReview = async (proposalId, officerId) => {
    // Get proposal details
    const proposalResult = await pool.query(
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

    // Update status to IN_REVIEW if it's SUBMITTED
    if (proposal.status === 'SUBMITTED') {
        await pool.query(
            `UPDATE "Proposal" SET status = 'IN_REVIEW', "updatedAt" = NOW() WHERE id = $1`,
            [proposalId]
        );

        // Add status history
        await pool.query(
            `INSERT INTO "StatusHistory" (id, status, "proposalId", "changedAt")
       VALUES (gen_random_uuid(), 'IN_REVIEW', $1, NOW())`,
            [proposalId]
        );

        proposal.status = 'IN_REVIEW';
    }

    return proposal;
};

/**
 * SUBMIT VOTE ON PROPOSAL (Officer function)
 */
export const submitVote = async (proposalId, officerId, { vote, riskAssessment, revenueComment, notes }) => {
    // Check if officer has already voted on this proposal
    const existingVote = await pool.query(
        'SELECT id FROM "Review" WHERE "proposalId" = $1 AND "reviewerId" = $2',
        [proposalId, officerId]
    );

    if (existingVote.rows.length > 0) {
        throw new Error('You have already voted on this proposal');
    }

    // Verify officer exists and is active
    const officerCheck = await pool.query(
        'SELECT id, status FROM "Officer" WHERE id = $1',
        [officerId]
    );

    if (officerCheck.rows.length === 0) {
        throw new Error('Officer not found');
    }

    if (officerCheck.rows[0].status !== 'ACTIVE') {
        throw new Error('Officer account is not active');
    }

    // Insert the review
    const reviewResult = await pool.query(
        `INSERT INTO "Review" (id, "proposalId", "reviewerId", vote, "riskAssessment", "revenueComment", notes, "createdAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
     RETURNING id`,
        [proposalId, officerId, vote, riskAssessment, revenueComment, notes]
    );

    // Count total votes for this proposal
    const voteCount = await pool.query(
        `SELECT 
       COUNT(*) as total_votes,
       COUNT(CASE WHEN vote = 'ACCEPT' THEN 1 END) as accept_votes,
       COUNT(CASE WHEN vote = 'REJECT' THEN 1 END) as reject_votes
     FROM "Review" 
     WHERE "proposalId" = $1`,
        [proposalId]
    );

    const { total_votes, accept_votes, reject_votes } = voteCount.rows[0];

    // Determine if proposal should be approved or rejected
    // For now, let's say 1 ACCEPT vote approves it, 1 REJECT vote rejects it
    let newStatus = 'IN_REVIEW';

    if (parseInt(accept_votes) >= 1) {
        newStatus = 'APPROVED';
    } else if (parseInt(reject_votes) >= 1) {
        newStatus = 'REJECTED';
    }

    // Update proposal status if decision is made
    if (newStatus !== 'IN_REVIEW') {
        await pool.query(
            `UPDATE "Proposal" SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
            [newStatus, proposalId]
        );

        // Add status history
        await pool.query(
            `INSERT INTO "StatusHistory" (id, status, "proposalId", "changedAt")
       VALUES (gen_random_uuid(), $1, $2, NOW())`,
            [newStatus, proposalId]
        );
    }

    return {
        reviewId: reviewResult.rows[0].id,
        currentAcceptVotes: parseInt(accept_votes),
        currentRejectVotes: parseInt(reject_votes),
        totalVotes: parseInt(total_votes),
        proposalStatus: newStatus
    };
};

/**
 * GET OFFICER'S REVIEW HISTORY
 */
export const getOfficerReviews = async (officerId) => {
    const result = await pool.query(
        `SELECT r.*, p."eventTitle", p."organizerId",
            u.name as "organizerName"
     FROM "Review" r
     JOIN "Proposal" p ON r."proposalId" = p.id
     JOIN "User" u ON p."organizerId" = u.id
     WHERE r."reviewerId" = $1
     ORDER BY r."createdAt" DESC`,
        [officerId]
    );

    return result.rows;
};