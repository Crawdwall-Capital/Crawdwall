import nodemailer from 'nodemailer';
import pool from '../../config/prisma.js';
import { v4 as uuidv4 } from 'uuid';

// Email configuration
const createEmailTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    });
};

/**
 * SEND PROPOSAL STATUS NOTIFICATION
 */
export const sendProposalStatusNotification = async (proposalId, newStatus, additionalData = {}) => {
    try {
        // Get proposal and organizer details
        const proposalResult = await pool.query(`
            SELECT p.*, u.name as "organizerName", u.email as "organizerEmail"
            FROM "Proposal" p
            JOIN "User" u ON p."organizerId" = u.id
            WHERE p.id = $1
        `, [proposalId]);

        if (proposalResult.rows.length === 0) {
            throw new Error('Proposal not found');
        }

        const proposal = proposalResult.rows[0];
        const transporter = createEmailTransporter();

        let subject, htmlContent;

        switch (newStatus) {
            case 'UNDER_REVIEW':
                subject = `Your proposal "${proposal.eventTitle}" is now under review`;
                htmlContent = `
                    <h2>Proposal Under Review</h2>
                    <p>Dear ${proposal.organizerName},</p>
                    <p>Your proposal "<strong>${proposal.eventTitle}</strong>" has been submitted successfully and is now under review by our investment committee.</p>
                    <p><strong>What happens next:</strong></p>
                    <ul>
                        <li>Our officers will review your proposal details</li>
                        <li>Each officer will provide a detailed assessment</li>
                        <li>You'll be notified once a decision is made</li>
                    </ul>
                    <p>Expected timeline: 5-7 business days</p>
                    <p>Best regards,<br>Crawdwall Capital Team</p>
                `;
                break;

            case 'APPROVED':
                subject = `🎉 Congratulations! Your proposal "${proposal.eventTitle}" has been approved`;
                htmlContent = `
                    <h2>Proposal Approved!</h2>
                    <p>Dear ${proposal.organizerName},</p>
                    <p>Excellent news! Your proposal "<strong>${proposal.eventTitle}</strong>" has been approved by our investment committee.</p>
                    <p><strong>Approval Details:</strong></p>
                    <ul>
                        <li>Accept Votes: ${additionalData.acceptVotes || 'N/A'}</li>
                        <li>Total Votes: ${additionalData.totalVotes || 'N/A'}</li>
                        <li>Expected Revenue: $${proposal.expectedRevenue?.toLocaleString() || 'N/A'}</li>
                    </ul>
                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li>A callback meeting will be scheduled within 48 hours</li>
                        <li>You'll receive funding agreement documents</li>
                        <li>Our team will contact you to discuss implementation</li>
                    </ul>
                    <p>Congratulations on this achievement!</p>
                    <p>Best regards,<br>Crawdwall Capital Team</p>
                `;
                break;

            case 'REJECTED':
                subject = `Update on your proposal "${proposal.eventTitle}"`;
                htmlContent = `
                    <h2>Proposal Decision Update</h2>
                    <p>Dear ${proposal.organizerName},</p>
                    <p>Thank you for submitting your proposal "<strong>${proposal.eventTitle}</strong>" to Crawdwall Capital.</p>
                    <p>After careful review by our investment committee, we have decided not to move forward with this proposal at this time.</p>
                    <p><strong>This decision was based on:</strong></p>
                    <ul>
                        <li>Current market conditions</li>
                        <li>Investment portfolio alignment</li>
                        <li>Risk assessment factors</li>
                    </ul>
                    <p><strong>Future Opportunities:</strong></p>
                    <ul>
                        <li>You may reapply after 90 days</li>
                        <li>Consider our feedback for future proposals</li>
                        <li>We encourage you to refine your business model</li>
                    </ul>
                    <p>We appreciate your interest in Crawdwall Capital and wish you success in your endeavors.</p>
                    <p>Best regards,<br>Crawdwall Capital Team</p>
                `;
                break;

            default:
                return; // No notification for other statuses
        }

        // Send email
        await transporter.sendMail({
            from: process.env.SMTP_USER || '"Crawdwall Capital" <notifications@crawdwall.com>',
            to: proposal.organizerEmail,
            subject: subject,
            html: htmlContent
        });

        // Log notification in database
        await logNotification(proposalId, proposal.organizerId, 'EMAIL', newStatus, {
            email: proposal.organizerEmail,
            subject: subject
        });

        console.log(`✅ Notification sent to ${proposal.organizerEmail} for status: ${newStatus}`);

    } catch (error) {
        console.error('❌ Failed to send notification:', error.message);
        // Don't throw error - notifications shouldn't break the main flow
    }
};

/**
 * SEND OFFICER NOTIFICATIONS
 */
export const sendOfficerNotifications = async (type, data) => {
    try {
        // Get all active officers
        const officersResult = await pool.query(`
            SELECT id, name, email FROM "Officer" 
            WHERE status = 'ACTIVE'
        `);

        const officers = officersResult.rows;
        const transporter = createEmailTransporter();

        let subject, htmlContent;

        switch (type) {
            case 'NEW_PROPOSAL':
                subject = `New proposal submitted: "${data.eventTitle}"`;
                htmlContent = `
                    <h2>New Proposal for Review</h2>
                    <p>A new proposal has been submitted and requires your review:</p>
                    <p><strong>Proposal Details:</strong></p>
                    <ul>
                        <li>Title: ${data.eventTitle}</li>
                        <li>Organizer: ${data.organizerName}</li>
                        <li>Expected Revenue: $${data.expectedRevenue?.toLocaleString() || 'N/A'}</li>
                        <li>Timeline: ${data.timeline || 'N/A'}</li>
                    </ul>
                    <p>Please log in to the platform to review and vote on this proposal.</p>
                    <p>Best regards,<br>Crawdwall Capital System</p>
                `;
                break;

            case 'THRESHOLD_ALERT':
                subject = `Voting threshold alert: "${data.eventTitle}"`;
                htmlContent = `
                    <h2>Proposal Nearing Decision</h2>
                    <p>The proposal "<strong>${data.eventTitle}</strong>" is nearing the voting threshold:</p>
                    <p><strong>Current Status:</strong></p>
                    <ul>
                        <li>Accept Votes: ${data.acceptVotes}</li>
                        <li>Total Votes: ${data.totalVotes}</li>
                        <li>Threshold: ${data.threshold}</li>
                    </ul>
                    <p>If you haven't voted yet, please review and submit your vote.</p>
                    <p>Best regards,<br>Crawdwall Capital System</p>
                `;
                break;

            case 'PROPOSAL_DECIDED':
                subject = `Proposal decision: "${data.eventTitle}" - ${data.decision}`;
                htmlContent = `
                    <h2>Proposal Decision Made</h2>
                    <p>The proposal "<strong>${data.eventTitle}</strong>" has been ${data.decision.toLowerCase()}.</p>
                    <p><strong>Final Results:</strong></p>
                    <ul>
                        <li>Accept Votes: ${data.acceptVotes}</li>
                        <li>Reject Votes: ${data.rejectVotes}</li>
                        <li>Total Votes: ${data.totalVotes}</li>
                    </ul>
                    <p>Thank you for your participation in the review process.</p>
                    <p>Best regards,<br>Crawdwall Capital System</p>
                `;
                break;
        }

        // Send to all officers
        for (const officer of officers) {
            await transporter.sendMail({
                from: process.env.SMTP_USER || '"Crawdwall Capital" <notifications@crawdwall.com>',
                to: officer.email,
                subject: subject,
                html: htmlContent
            });

            // Log notification
            await logNotification(data.proposalId || null, officer.id, 'EMAIL', type, {
                email: officer.email,
                subject: subject
            });
        }

        console.log(`✅ Officer notifications sent to ${officers.length} officers for: ${type}`);

    } catch (error) {
        console.error('❌ Failed to send officer notifications:', error.message);
    }
};

/**
 * SCHEDULE CALLBACK MEETING
 */
export const scheduleCallbackMeeting = async (proposalId) => {
    try {
        // Get proposal and organizer details
        const proposalResult = await pool.query(`
            SELECT p.*, u.name as "organizerName", u.email as "organizerEmail", u."phoneNumber"
            FROM "Proposal" p
            JOIN "User" u ON p."organizerId" = u.id
            WHERE p.id = $1
        `, [proposalId]);

        if (proposalResult.rows.length === 0) {
            throw new Error('Proposal not found');
        }

        const proposal = proposalResult.rows[0];

        // Create callback record
        const callbackId = uuidv4();
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 2); // Schedule 2 days from now

        await pool.query(`
            INSERT INTO "CallbackMeeting" (id, "proposalId", "organizerId", "scheduledDate", status, "createdAt")
            VALUES ($1, $2, $3, $4, 'SCHEDULED', NOW())
        `, [callbackId, proposalId, proposal.organizerId, scheduledDate]);

        // Send callback notification email
        const transporter = createEmailTransporter();
        await transporter.sendMail({
            from: process.env.SMTP_USER || '"Crawdwall Capital" <meetings@crawdwall.com>',
            to: proposal.organizerEmail,
            subject: `Callback Meeting Scheduled - ${proposal.eventTitle}`,
            html: `
                <h2>Callback Meeting Scheduled</h2>
                <p>Dear ${proposal.organizerName},</p>
                <p>Congratulations again on your proposal approval! We have scheduled a callback meeting to discuss the next steps.</p>
                <p><strong>Meeting Details:</strong></p>
                <ul>
                    <li>Proposal: ${proposal.eventTitle}</li>
                    <li>Scheduled Date: ${scheduledDate.toLocaleDateString()}</li>
                    <li>Time: We will contact you to confirm the exact time</li>
                    <li>Contact: ${proposal.phoneNumber || 'Please provide your phone number'}</li>
                </ul>
                <p><strong>Meeting Agenda:</strong></p>
                <ul>
                    <li>Funding agreement discussion</li>
                    <li>Implementation timeline</li>
                    <li>Milestone planning</li>
                    <li>Next steps and requirements</li>
                </ul>
                <p>Our team will contact you within 24 hours to confirm the meeting time.</p>
                <p>Best regards,<br>Crawdwall Capital Team</p>
            `
        });

        console.log(`✅ Callback meeting scheduled for proposal: ${proposal.eventTitle}`);
        return { callbackId, scheduledDate };

    } catch (error) {
        console.error('❌ Failed to schedule callback meeting:', error.message);
        throw error;
    }
};

/**
 * LOG NOTIFICATION
 */
async function logNotification(proposalId, userId, type, event, details) {
    try {
        await pool.query(`
            INSERT INTO "Notification" (id, "proposalId", "userId", type, event, details, "sentAt", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [uuidv4(), proposalId, userId, type, event, JSON.stringify(details)]);
    } catch (error) {
        console.error('Failed to log notification:', error.message);
    }
}

/**
 * GET USER NOTIFICATIONS
 */
export const getUserNotifications = async (userId, limit = 20) => {
    const result = await pool.query(`
        SELECT * FROM "Notification"
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
        LIMIT $2
    `, [userId, limit]);

    return result.rows;
};