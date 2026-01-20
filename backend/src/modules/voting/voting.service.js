import pool from '../../config/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import { sendProposalStatusNotification, sendOfficerNotifications } from '../notifications/notification.service.js';

// Voting configuration (can be made configurable by Admin later)
const VOTING_CONFIG = {
    ACCEPTANCE_THRESHOLD: 4, // Minimum votes needed to accept
    TOTAL_OFFICERS: null // Will be calculated dynamically
};

/**
 * SUBMIT VOTE (Officer function)
 * Core business logic for proposal voting
 */
export const submitVote = async (officerId, proposalId, voteData) => {
    const { decision, riskAssessment, revenueComment, notes } = voteData;

    // Validate decision
    if (!['ACCEPT', 'REJECT'].includes(decision)) {
        throw new Error('Invalid decision. Must be ACCEPT or REJECT');
    }

    // Validate required fields
    if (!riskAssessment || !revenueComment) {
        throw new Error('Risk assessment and revenue comment are required');
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check if proposal exists and is in votable state
        const proposalResult = await client.query(
            'SELECT id, status, "organizerId" FROM "Proposal" WHERE id = $1',
            [proposalId]
        );

        if (proposalResult.rows.length === 0) {
            throw new Error('Proposal not found');
        }

        const proposal = proposalResult.rows[0];

        // Only allow voting on SUBMITTED or UNDER_REVIEW proposals
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status)) {
            throw new Error(`Cannot vote on proposal with status: ${proposal.status}`);
        }

        // 2. Check if officer has already voted
        const existingVote = await client.query(
            'SELECT id FROM "Vote" WHERE "proposalId" = $1 AND "officerId" = $2',
            [proposalId, officerId]
        );

        if (existingVote.rows.length > 0) {
            throw new Error('Officer has already voted on this proposal');
        }

        // 3. Update proposal status to UNDER_REVIEW if not already
        if (proposal.status === 'SUBMITTED') {
            await client.query(
                'UPDATE "Proposal" SET status = $1, "updatedAt" = NOW() WHERE id = $2',
                ['UNDER_REVIEW', proposalId]
            );

            // Log status change
            await logProposalAction(client, proposalId, 'STATUS_CHANGE', officerId, 'OFFICER', {
                oldStatus: 'SUBMITTED',
                newStatus: 'UNDER_REVIEW',
                trigger: 'FIRST_OFFICER_VOTE'
            });
        }

        // 4. Insert the vote
        const voteId = uuidv4();
        await client.query(
            `INSERT INTO "Vote" (id, "proposalId", "officerId", decision, "riskAssessment", "revenueComment", notes, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
            [voteId, proposalId, officerId, decision, riskAssessment, revenueComment, notes]
        );

        // 5. Log the vote action
        await logProposalAction(client, proposalId, 'VOTE_SUBMITTED', officerId, 'OFFICER', {
            decision,
            voteId
        });

        // 6. Check voting threshold and update proposal status if needed
        const voteResult = await checkVotingThreshold(client, proposalId);

        // 7. Send real-time notification to organizer about the vote
        await sendVoteNotificationToOrganizer(proposalId, decision, voteResult);

        await client.query('COMMIT');

        return {
            voteId,
            decision,
            proposalStatus: voteResult.newStatus || 'UNDER_REVIEW',
            thresholdMet: voteResult.thresholdMet,
            totalVotes: voteResult.totalVotes,
            acceptVotes: voteResult.acceptVotes
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * CHECK VOTING THRESHOLD
 * Implements the 4-vote acceptance rule from PRD
 */
async function checkVotingThreshold(client, proposalId) {
    // Get all votes for this proposal
    const votesResult = await client.query(
        'SELECT decision FROM "Vote" WHERE "proposalId" = $1',
        [proposalId]
    );

    const votes = votesResult.rows;
    const totalVotes = votes.length;
    const acceptVotes = votes.filter(v => v.decision === 'ACCEPT').length;
    const rejectVotes = votes.filter(v => v.decision === 'REJECT').length;

    let newStatus = null;
    let thresholdMet = false;

    // Check acceptance threshold (4 ACCEPT votes)
    if (acceptVotes >= VOTING_CONFIG.ACCEPTANCE_THRESHOLD) {
        newStatus = 'APPROVED';
        thresholdMet = true;

        // Update proposal status
        await client.query(
            'UPDATE "Proposal" SET status = $1, "updatedAt" = NOW() WHERE id = $2',
            ['APPROVED', proposalId]
        );

        // Log acceptance
        await logProposalAction(client, proposalId, 'PROPOSAL_ACCEPTED', 'SYSTEM', 'SYSTEM', {
            acceptVotes,
            totalVotes,
            threshold: VOTING_CONFIG.ACCEPTANCE_THRESHOLD
        });

        // Trigger acceptance workflow
        await triggerAcceptanceWorkflow(client, proposalId, acceptVotes, totalVotes);

    } else {
        // Check if proposal should be rejected based on business rules
        // For now, we'll implement a simple rule: if we have enough total votes but not enough accepts
        const totalOfficers = await getTotalActiveOfficers(client);

        // If more than half of officers have voted and we don't have 4 accepts, 
        // and it's mathematically impossible to reach 4 accepts, auto-reject
        if (totalVotes >= Math.ceil(totalOfficers / 2)) {
            const remainingOfficers = totalOfficers - totalVotes;
            const maxPossibleAccepts = acceptVotes + remainingOfficers;

            if (maxPossibleAccepts < VOTING_CONFIG.ACCEPTANCE_THRESHOLD) {
                // Auto-reject: mathematically impossible to reach threshold
                newStatus = 'REJECTED';

                await client.query(
                    'UPDATE "Proposal" SET status = $1, "updatedAt" = NOW() WHERE id = $2',
                    ['REJECTED', proposalId]
                );

                // Log auto-rejection
                await logProposalAction(client, proposalId, 'PROPOSAL_AUTO_REJECTED', 'SYSTEM', 'SYSTEM', {
                    acceptVotes,
                    totalVotes,
                    totalOfficers,
                    remainingOfficers,
                    maxPossibleAccepts,
                    threshold: VOTING_CONFIG.ACCEPTANCE_THRESHOLD,
                    reason: 'MATHEMATICALLY_IMPOSSIBLE_TO_REACH_THRESHOLD'
                });

                // Trigger rejection workflow
                await triggerRejectionWorkflow(client, proposalId, acceptVotes, totalVotes, 'AUTO_REJECTION');
            }
        }
    }

    return {
        newStatus,
        thresholdMet,
        totalVotes,
        acceptVotes,
        rejectVotes
    };
}

/**
 * GET PROPOSAL VOTES
 * Returns voting information for a proposal
 */
export const getProposalVotes = async (proposalId, requestingOfficerId = null) => {
    const client = await pool.connect();

    try {
        // Get proposal info
        const proposalResult = await client.query(
            'SELECT id, status, "eventTitle" FROM "Proposal" WHERE id = $1',
            [proposalId]
        );

        if (proposalResult.rows.length === 0) {
            throw new Error('Proposal not found');
        }

        const proposal = proposalResult.rows[0];

        // Get vote summary
        const votesResult = await client.query(
            `SELECT 
                COUNT(*) as total_votes,
                COUNT(CASE WHEN decision = 'ACCEPT' THEN 1 END) as accept_votes,
                COUNT(CASE WHEN decision = 'REJECT' THEN 1 END) as reject_votes
             FROM "Vote" 
             WHERE "proposalId" = $1`,
            [proposalId]
        );

        const voteSummary = votesResult.rows[0];

        // Check if requesting officer has voted
        let hasVoted = false;
        let officerVote = null;

        if (requestingOfficerId) {
            const officerVoteResult = await client.query(
                'SELECT decision, "riskAssessment", "revenueComment", notes, "createdAt" FROM "Vote" WHERE "proposalId" = $1 AND "officerId" = $2',
                [proposalId, requestingOfficerId]
            );

            if (officerVoteResult.rows.length > 0) {
                hasVoted = true;
                officerVote = officerVoteResult.rows[0];
            }
        }

        // Get detailed votes (only if officer has voted - PRD requirement)
        let detailedVotes = [];
        if (hasVoted || !requestingOfficerId) {
            const detailedResult = await client.query(
                `SELECT v.decision, v."riskAssessment", v."revenueComment", v.notes, v."createdAt",
                        o.name as "officerName", o.email as "officerEmail"
                 FROM "Vote" v
                 JOIN "Officer" o ON v."officerId" = o.id
                 WHERE v."proposalId" = $1
                 ORDER BY v."createdAt" ASC`,
                [proposalId]
            );

            detailedVotes = detailedResult.rows;
        }

        return {
            proposal,
            voteSummary: {
                totalVotes: parseInt(voteSummary.total_votes),
                acceptVotes: parseInt(voteSummary.accept_votes),
                rejectVotes: parseInt(voteSummary.reject_votes),
                threshold: VOTING_CONFIG.ACCEPTANCE_THRESHOLD,
                thresholdMet: parseInt(voteSummary.accept_votes) >= VOTING_CONFIG.ACCEPTANCE_THRESHOLD
            },
            officerVote,
            hasVoted,
            detailedVotes: hasVoted ? detailedVotes : []
        };

    } finally {
        client.release();
    }
};

/**
 * TRACK PROPOSAL VIEW
 * Logs when an officer views a proposal
 */
export const trackProposalView = async (proposalId, officerId) => {
    try {
        const viewId = uuidv4();
        await pool.query(
            `INSERT INTO "ProposalView" (id, "proposalId", "officerId", "viewedAt")
             VALUES ($1, $2, $3, NOW())`,
            [viewId, proposalId, officerId]
        );

        // Log the view action
        await pool.query(
            `INSERT INTO "ProposalAudit" (id, "proposalId", action, "performedBy", "performedByRole", details, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [uuidv4(), proposalId, 'PROPOSAL_VIEWED', officerId, 'OFFICER', JSON.stringify({ viewId })]
        );

        return { viewId, viewedAt: new Date() };

    } catch (error) {
        // Don't throw error for view tracking - it's not critical
        console.error('Error tracking proposal view:', error.message);
        return null;
    }
};

/**
 * GET OFFICER VOTING HISTORY
 */
export const getOfficerVotingHistory = async (officerId) => {
    const result = await pool.query(
        `SELECT v.id, v.decision, v."createdAt", 
                p.id as "proposalId", p."eventTitle", p.status as "proposalStatus"
         FROM "Vote" v
         JOIN "Proposal" p ON v."proposalId" = p.id
         WHERE v."officerId" = $1
         ORDER BY v."createdAt" DESC`,
        [officerId]
    );

    return result.rows;
};

/**
 * TRIGGER ACCEPTANCE WORKFLOW
 * Implements PRD acceptance flow automation
 */
export async function triggerAcceptanceWorkflow(client, proposalId, acceptVotes, totalVotes) {
    try {
        // Get proposal and organizer details
        const proposalResult = await client.query(
            `SELECT p.*, u.name as "organizerName", u.email as "organizerEmail"
             FROM "Proposal" p
             JOIN "User" u ON p."organizerId" = u.id
             WHERE p.id = $1`,
            [proposalId]
        );

        if (proposalResult.rows.length === 0) {
            throw new Error('Proposal not found for acceptance workflow');
        }

        const proposal = proposalResult.rows[0];

        // 1. Schedule callback meeting (7 days from now)
        const callbackDate = new Date();
        callbackDate.setDate(callbackDate.getDate() + 7);

        await client.query(
            `INSERT INTO "CallbackSchedule" (id, "proposalId", "organizerId", "scheduledDate", status, "createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3, 'SCHEDULED', NOW())`,
            [proposalId, proposal.organizerId, callbackDate]
        );

        // 2. Send acceptance notification to organizer
        await sendProposalStatusNotification(proposalId, 'APPROVED', {
            acceptVotes,
            totalVotes,
            callbackDate: callbackDate.toISOString()
        });

        // 3. Send notification to officers about the decision
        await sendOfficerNotifications('PROPOSAL_DECIDED', {
            proposalId,
            eventTitle: proposal.eventTitle,
            decision: 'APPROVED',
            acceptVotes,
            rejectVotes: totalVotes - acceptVotes,
            totalVotes
        });

        // 3. Unlock funding agreement stage
        await client.query(
            `UPDATE "Proposal" 
             SET "fundingStage" = 'AGREEMENT_PENDING', "callbackScheduled" = $1, "updatedAt" = NOW()
             WHERE id = $2`,
            [callbackDate, proposalId]
        );

        // 4. Lock admin voting
        await client.query(
            `UPDATE "Vote" 
             SET "locked" = true, "lockedAt" = NOW()
             WHERE "proposalId" = $1`,
            [proposalId]
        );

        // 5. Log acceptance workflow completion
        await logProposalAction(client, proposalId, 'ACCEPTANCE_WORKFLOW_TRIGGERED', 'SYSTEM', 'SYSTEM', {
            callbackScheduled: callbackDate,
            fundingStage: 'AGREEMENT_PENDING',
            votingLocked: true
        });

        console.log(`✅ Acceptance workflow triggered for proposal ${proposalId}`);

    } catch (error) {
        console.error('Error in acceptance workflow:', error.message);
        // Don't throw - acceptance workflow failure shouldn't block the main voting process
    }
}

/**
 * SEND ACCEPTANCE NOTIFICATION
 * Sends email notification to organizer about proposal acceptance
 */
async function sendAcceptanceNotification(proposal, acceptVotes, totalVotes, callbackDate) {
    try {
        const nodemailer = await import('nodemailer');

        const transporter = nodemailer.default.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            }
        });

        const emailContent = `
            <h2>🎉 Proposal Accepted - Crawdwall Capital</h2>
            
            <p>Dear ${proposal.organizerName},</p>
            
            <p>Congratulations! Your proposal "<strong>${proposal.eventTitle}</strong>" has been accepted by our investment committee.</p>
            
            <h3>Voting Results:</h3>
            <ul>
                <li>Accept Votes: <strong>${acceptVotes}</strong></li>
                <li>Total Votes: <strong>${totalVotes}</strong></li>
                <li>Decision: <strong>APPROVED</strong></li>
            </ul>
            
            <h3>Next Steps:</h3>
            <p>A callback meeting has been automatically scheduled for <strong>${callbackDate.toLocaleDateString()}</strong> to discuss the funding agreement and next steps.</p>
            
            <p>Our team will contact you within 24 hours to confirm the meeting details.</p>
            
            <p>Thank you for choosing Crawdwall Capital for your event funding needs.</p>
            
            <p>Best regards,<br>
            The Crawdwall Capital Team</p>
        `;

        await transporter.sendMail({
            from: process.env.SMTP_USER || '"Crawdwall Capital" <noreply@crawdwall.com>',
            to: proposal.organizerEmail,
            subject: `🎉 Proposal Accepted: ${proposal.eventTitle}`,
            html: emailContent
        });

        console.log(`✅ Acceptance notification sent to ${proposal.organizerEmail}`);

    } catch (error) {
        console.error('Error sending acceptance notification:', error.message);
        // Don't throw - notification failure shouldn't block the workflow
    }
}

/**
 * TRIGGER REJECTION WORKFLOW
 * Implements PRD rejection flow automation
 */
async function triggerRejectionWorkflow(client, proposalId, acceptVotes, totalVotes, rejectionType = 'AUTO_REJECTION') {
    try {
        // Get proposal and organizer details
        const proposalResult = await client.query(
            `SELECT p.*, u.name as "organizerName", u.email as "organizerEmail"
             FROM "Proposal" p
             JOIN "User" u ON p."organizerId" = u.id
             WHERE p.id = $1`,
            [proposalId]
        );

        if (proposalResult.rows.length === 0) {
            throw new Error('Proposal not found for rejection workflow');
        }

        const proposal = proposalResult.rows[0];

        // 1. Send rejection notification to organizer
        await sendProposalStatusNotification(proposalId, 'REJECTED', {
            acceptVotes,
            totalVotes,
            rejectionType
        });

        // 2. Send notification to officers about the decision
        await sendOfficerNotifications('PROPOSAL_DECIDED', {
            proposalId,
            eventTitle: proposal.eventTitle,
            decision: 'REJECTED',
            acceptVotes,
            rejectVotes: totalVotes - acceptVotes,
            totalVotes
        });

        // 2. Archive admin reviews
        await client.query(
            `UPDATE "Vote" 
             SET "archived" = true, "archivedAt" = NOW()
             WHERE "proposalId" = $1`,
            [proposalId]
        );

        // 3. Lock proposal (read-only)
        await client.query(
            `UPDATE "Proposal" 
             SET "locked" = true, "lockedAt" = NOW(), "reapplicationAllowed" = true, "reapplicationDate" = $1
             WHERE id = $2`,
            [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), proposalId] // 30 days from now
        );

        // 4. Log rejection workflow completion
        await logProposalAction(client, proposalId, 'REJECTION_WORKFLOW_TRIGGERED', 'SYSTEM', 'SYSTEM', {
            rejectionType,
            reviewsArchived: true,
            proposalLocked: true,
            reapplicationAllowed: true,
            reapplicationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        console.log(`✅ Rejection workflow triggered for proposal ${proposalId}`);

    } catch (error) {
        console.error('Error in rejection workflow:', error.message);
        // Don't throw - rejection workflow failure shouldn't block the main voting process
    }
}

/**
 * SEND REJECTION NOTIFICATION
 */
async function sendRejectionNotification(proposal, acceptVotes, totalVotes, rejectionType) {
    try {
        const nodemailer = await import('nodemailer');

        const transporter = nodemailer.default.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            }
        });

        const rejectionReason = rejectionType === 'AUTO_REJECTION'
            ? 'The proposal did not receive sufficient support from our investment committee.'
            : 'The proposal was rejected by our investment committee.';

        const emailContent = `
            <h2>Proposal Decision - Crawdwall Capital</h2>
            
            <p>Dear ${proposal.organizerName},</p>
            
            <p>Thank you for submitting your proposal "<strong>${proposal.eventTitle}</strong>" to Crawdwall Capital.</p>
            
            <p>After careful review by our investment committee, we regret to inform you that your proposal has not been approved at this time.</p>
            
            <h3>Voting Results:</h3>
            <ul>
                <li>Accept Votes: <strong>${acceptVotes}</strong></li>
                <li>Total Votes: <strong>${totalVotes}</strong></li>
                <li>Required for Approval: <strong>4</strong></li>
                <li>Decision: <strong>NOT APPROVED</strong></li>
            </ul>
            
            <h3>Next Steps:</h3>
            <p>${rejectionReason}</p>
            
            <p>You may resubmit an improved proposal after <strong>30 days</strong> from today. We encourage you to:</p>
            <ul>
                <li>Review and strengthen your business plan</li>
                <li>Provide more detailed financial projections</li>
                <li>Address potential risk factors</li>
                <li>Consider market timing and competition</li>
            </ul>
            
            <p>We appreciate your interest in Crawdwall Capital and wish you success in your future endeavors.</p>
            
            <p>Best regards,<br>
            The Crawdwall Capital Team</p>
        `;

        await transporter.sendMail({
            from: process.env.SMTP_USER || '"Crawdwall Capital" <noreply@crawdwall.com>',
            to: proposal.organizerEmail,
            subject: `Proposal Decision: ${proposal.eventTitle}`,
            html: emailContent
        });

        console.log(`✅ Rejection notification sent to ${proposal.organizerEmail}`);

    } catch (error) {
        console.error('Error sending rejection notification:', error.message);
        // Don't throw - notification failure shouldn't block the workflow
    }
}

/**
 * GET TOTAL ACTIVE OFFICERS
 */
async function getTotalActiveOfficers(client) {
    const result = await client.query('SELECT COUNT(*) as count FROM "Officer" WHERE status = \'ACTIVE\'');
    return parseInt(result.rows[0].count);
}

/**
 * LOG PROPOSAL ACTION
 * Helper function for audit trail
 */
async function logProposalAction(client, proposalId, action, performedBy, performedByRole, details = {}) {
    const auditId = uuidv4();
    await client.query(
        `INSERT INTO "ProposalAudit" (id, "proposalId", action, "performedBy", "performedByRole", details, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [auditId, proposalId, action, performedBy, performedByRole, JSON.stringify(details)]
    );

    return auditId;
}

/**
 * GET PROPOSAL AUDIT TRAIL
 */
export const getProposalAuditTrail = async (proposalId) => {
    const result = await pool.query(
        `SELECT pa.*, 
                CASE 
                    WHEN pa."performedByRole" = 'OFFICER' THEN o.name
                    WHEN pa."performedByRole" = 'ADMIN' THEN 'Admin'
                    ELSE pa."performedBy"
                END as "performedByName"
         FROM "ProposalAudit" pa
         LEFT JOIN "Officer" o ON pa."performedBy" = o.id AND pa."performedByRole" = 'OFFICER'
         WHERE pa."proposalId" = $1
         ORDER BY pa.timestamp ASC`,
        [proposalId]
    );

    return result.rows;
};
/**
 * SEND REAL-TIME VOTE NOTIFICATION TO ORGANIZER
 */
async function sendVoteNotificationToOrganizer(proposalId, decision, voteResult) {
    try {
        // Get proposal and organizer details
        const proposalResult = await pool.query(
            `SELECT p.*, u.name as "organizerName", u.email as "organizerEmail"
             FROM "Proposal" p
             JOIN "User" u ON p."organizerId" = u.id
             WHERE p.id = $1`,
            [proposalId]
        );

        if (proposalResult.rows.length === 0) {
            return; // Proposal not found
        }

        const proposal = proposalResult.rows[0];

        // Create notification content based on vote and current status
        let notificationTitle, notificationMessage;

        if (voteResult.newStatus === 'APPROVED') {
            // Proposal was just approved
            notificationTitle = `🎉 Your proposal "${proposal.eventTitle}" has been APPROVED!`;
            notificationMessage = `Congratulations! Your proposal has received ${voteResult.acceptVotes} accept votes and has been approved for funding. A callback meeting will be scheduled within 48 hours.`;
        } else if (voteResult.newStatus === 'REJECTED') {
            // Proposal was just rejected
            notificationTitle = `Your proposal "${proposal.eventTitle}" decision update`;
            notificationMessage = `Your proposal has been reviewed and unfortunately was not approved at this time. You may reapply after 30 days with an updated proposal.`;
        } else {
            // Vote received but no final decision yet
            const voteType = decision === 'ACCEPT' ? 'positive' : 'negative';
            notificationTitle = `New vote received for "${proposal.eventTitle}"`;
            notificationMessage = `An officer has submitted a ${voteType} vote for your proposal. Current status: ${voteResult.acceptVotes} accept votes out of ${voteResult.totalVotes} total votes. (${4 - voteResult.acceptVotes} more accepts needed for approval)`;
        }

        // Send email notification using the notification service
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            }
        });

        await transporter.sendMail({
            from: process.env.SMTP_USER || '"Crawdwall Capital" <notifications@crawdwall.com>',
            to: proposal.organizerEmail,
            subject: notificationTitle,
            html: `
                <h2>${notificationTitle}</h2>
                <p>Dear ${proposal.organizerName},</p>
                <p>${notificationMessage}</p>
                <p><strong>Proposal Details:</strong></p>
                <ul>
                    <li>Title: ${proposal.eventTitle}</li>
                    <li>Current Status: ${voteResult.newStatus || 'Under Review'}</li>
                    <li>Accept Votes: ${voteResult.acceptVotes}</li>
                    <li>Total Votes: ${voteResult.totalVotes}</li>
                    <li>Threshold: 4 accept votes</li>
                </ul>
                ${voteResult.newStatus ? '' : '<p>We will notify you immediately when a final decision is made.</p>'}
                <p>Best regards,<br>Crawdwall Capital Team</p>
            `
        });

        // Log the notification
        await pool.query(
            `INSERT INTO "Notification" (id, "proposalId", "userId", type, event, details, "sentAt", "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
            [
                uuidv4(),
                proposalId,
                proposal.organizerId,
                'EMAIL',
                'VOTE_RECEIVED',
                JSON.stringify({
                    decision,
                    acceptVotes: voteResult.acceptVotes,
                    totalVotes: voteResult.totalVotes,
                    newStatus: voteResult.newStatus,
                    email: proposal.organizerEmail,
                    subject: notificationTitle
                })
            ]
        );

        console.log(`✅ Real-time vote notification sent to ${proposal.organizerEmail} for proposal: ${proposal.eventTitle}`);

    } catch (error) {
        console.error('❌ Failed to send vote notification to organizer:', error.message);
        // Don't throw error - notifications shouldn't break the voting process
    }
}