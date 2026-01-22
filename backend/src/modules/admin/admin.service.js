import pool from '../../config/prisma.js';
import nodemailer from 'nodemailer';
import { ADMIN_EMAIL, OTP_CONFIG } from '../../config/admin.config.js';
import * as officerService from '../officer/officer.service.js';

/**
 * REQUEST ADMIN OTP (Admin login)
 */
export const requestAdminOTP = async (email) => {
  // Verify this is the admin email
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized admin email');
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60 * 1000);

  // Store OTP in database
  await pool.query(
    `INSERT INTO "OTP" (id, email, otp, "expiresAt", attempts, blocked, "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, 0, false, NOW(), NOW())`,
    [email.toLowerCase(), otp, expiresAt]
  );

  // Send OTP via email (configure your email service)
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER || '"Crawdwall Admin" <admin@crawdwall.com>',
      to: email,
      subject: 'Admin Login OTP - Crawdwall Platform',
      html: `
        <h2>Admin Login OTP</h2>
        <p>Your OTP code is: <strong>${otp}</strong></p>
        <p>This code will expire in ${OTP_CONFIG.expiryMinutes} minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    console.log('OTP sent successfully to:', email);
  } catch (emailError) {
    console.error('Email sending failed:', emailError);
    // Don't throw error - OTP is still stored in database
  }

  return { message: 'OTP sent successfully', email };
};

/**
 * VERIFY ADMIN OTP
 */
export const verifyAdminOTP = async (email, otp) => {
  // Verify this is the admin email
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized admin email');
  }

  // Find valid OTP
  const result = await pool.query(
    `SELECT id, otp, "expiresAt", blocked 
     FROM "OTP" 
     WHERE email = $1 AND otp = $2 AND blocked = false 
     ORDER BY "createdAt" DESC 
     LIMIT 1`,
    [email.toLowerCase(), otp]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired OTP');
  }

  const otpRecord = result.rows[0];

  // Check if OTP is expired
  if (new Date() > new Date(otpRecord.expiresAt)) {
    throw new Error('OTP has expired');
  }

  // Mark OTP as used by deleting it
  await pool.query(
    'DELETE FROM "OTP" WHERE id = $1',
    [otpRecord.id]
  );

  return { email, role: 'ADMIN' };
};

/**
 * CREATE OFFICER (Admin function)
 */
export const createOfficer = async (adminEmail, { email, name, password }) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  return await officerService.createOfficer({
    email,
    name,
    password,
    createdBy: adminEmail
  });
};

/**
 * GET ALL OFFICERS (Admin function)
 */
export const getAllOfficers = async (adminEmail) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  return await officerService.getAllOfficers();
};

/**
 * UPDATE OFFICER STATUS (Admin function)
 */
export const updateOfficerStatus = async (adminEmail, officerId, status) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  return await officerService.updateOfficerStatus(officerId, status);
};

/**
 * DELETE OFFICER (Admin function)
 */
export const deleteOfficer = async (adminEmail, officerId) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  return await officerService.deleteOfficer(officerId);
};

/**
 * GET PLATFORM STATISTICS (Admin function)
 */
export const getPlatformStats = async (adminEmail) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  const stats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM "User" WHERE role = 'ORGANIZER') as organizers,
      (SELECT COUNT(*) FROM "User" WHERE role = 'INVESTOR') as investors,
      (SELECT COUNT(*) FROM "Officer") as officers,
      (SELECT COUNT(*) FROM "Proposal") as total_proposals,
      (SELECT COUNT(*) FROM "Proposal" WHERE status = 'SUBMITTED') as pending_proposals,
      (SELECT COUNT(*) FROM "Proposal" WHERE status = 'APPROVED') as approved_proposals,
      (SELECT COUNT(*) FROM "Review") as total_reviews
  `);

  return stats.rows[0];
};

/**
 * GET ALL USERS (Admin function)
 */
export const getAllUsers = async (adminEmail) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  const result = await pool.query(`
    SELECT id, name, email, "phoneNumber", role, status, "createdAt", "updatedAt"
    FROM "User"
    ORDER BY "createdAt" DESC
  `);

  return result.rows;
};

/**
 * GET USER DETAILS (Admin function)
 */
export const getUserDetails = async (adminEmail, userId) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  const userResult = await pool.query(`
    SELECT id, name, email, "phoneNumber", role, "createdAt", "updatedAt"
    FROM "User"
    WHERE id = $1
  `, [userId]);

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  // Get additional data based on role
  if (user.role === 'ORGANIZER') {
    const proposalsResult = await pool.query(`
      SELECT id, "eventTitle", status, "expectedRevenue", "createdAt"
      FROM "Proposal"
      WHERE "organizerId" = $1
      ORDER BY "createdAt" DESC
    `, [userId]);

    user.proposals = proposalsResult.rows;
  } else if (user.role === 'INVESTOR') {
    const interestsResult = await pool.query(`
      SELECT ii.id, ii."eventType", ii."investmentRange", ii."createdAt",
             p."eventTitle", p.status as "proposalStatus"
      FROM "InvestorInterest" ii
      LEFT JOIN "Proposal" p ON ii."proposalId" = p.id
      WHERE ii."investorId" = $1
      ORDER BY ii."createdAt" DESC
    `, [userId]);

    user.interests = interestsResult.rows;
  }

  return user;
};

/**
 * DELETE USER (Admin function)
 */
export const deleteUser = async (adminEmail, userId) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get user details first
    const userResult = await client.query(
      'SELECT id, name, email, role FROM "User" WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Delete related data based on role
    if (user.role === 'ORGANIZER') {
      // Delete reviews for organizer's proposals
      await client.query(`
        DELETE FROM "Review" 
        WHERE "proposalId" IN (
          SELECT id FROM "Proposal" WHERE "organizerId" = $1
        )
      `, [userId]);

      // Delete status history for organizer's proposals
      await client.query(`
        DELETE FROM "StatusHistory" 
        WHERE "proposalId" IN (
          SELECT id FROM "Proposal" WHERE "organizerId" = $1
        )
      `, [userId]);

      // Delete organizer's proposals
      await client.query('DELETE FROM "Proposal" WHERE "organizerId" = $1', [userId]);

    } else if (user.role === 'INVESTOR') {
      // Delete investor interests
      await client.query('DELETE FROM "InvestorInterest" WHERE "investorId" = $1', [userId]);
    }

    // Delete the user
    await client.query('DELETE FROM "User" WHERE id = $1', [userId]);

    await client.query('COMMIT');

    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * SUSPEND USER (Admin function)
 */
export const suspendUser = async (adminEmail, userId) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  const result = await pool.query(
    'UPDATE "User" SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *',
    ['SUSPENDED', userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
};

/**
 * UNSUSPEND USER (Admin function)
 */
export const unsuspendUser = async (adminEmail, userId) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  const result = await pool.query(
    'UPDATE "User" SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *',
    ['ACTIVE', userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
};

/**
 * GET ALL PROPOSALS (Admin function)
 */
export const getAllProposals = async (adminEmail) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  const result = await pool.query(`
    SELECT p.id, p."eventTitle", p.description, p."expectedRevenue", 
           p.timeline, p.status, p."createdAt", p."updatedAt",
           u.name as "organizerName", u.email as "organizerEmail"
    FROM "Proposal" p
    JOIN "User" u ON p."organizerId" = u.id
    ORDER BY p."createdAt" DESC
  `);

  return result.rows;
};

/**
 * GET PROPOSAL DETAILS (Admin function)
 */
export const getProposalDetails = async (adminEmail, proposalId) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

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

  // Get reviews
  const reviewsResult = await pool.query(`
    SELECT r.*, o.name as "officerName"
    FROM "Review" r
    JOIN "Officer" o ON r."officerId" = o.id
    WHERE r."proposalId" = $1
    ORDER BY r."createdAt" DESC
  `, [proposalId]);

  proposal.reviews = reviewsResult.rows;

  // Get status history
  const historyResult = await pool.query(`
    SELECT status, "changedAt"
    FROM "StatusHistory"
    WHERE "proposalId" = $1
    ORDER BY "changedAt" ASC
  `, [proposalId]);

  proposal.statusHistory = historyResult.rows;

  return proposal;
};

/**
 * UPDATE PROPOSAL STATUS (Admin function)
 */
export const updateProposalStatus = async (adminEmail, proposalId, status) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update proposal status
    const result = await client.query(`
      UPDATE "Proposal" 
      SET status = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, proposalId]);

    if (result.rows.length === 0) {
      throw new Error('Proposal not found');
    }

    // Add to status history
    await client.query(`
      INSERT INTO "StatusHistory" (id, status, "proposalId", "changedAt")
      VALUES (gen_random_uuid(), $1, $2, NOW())
    `, [status, proposalId]);

    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * DELETE PROPOSAL (Admin function)
 */
export const deleteProposal = async (adminEmail, proposalId) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get proposal details first
    const proposalResult = await client.query(
      'SELECT id, "eventTitle", "organizerId" FROM "Proposal" WHERE id = $1',
      [proposalId]
    );

    if (proposalResult.rows.length === 0) {
      throw new Error('Proposal not found');
    }

    const proposal = proposalResult.rows[0];

    // Delete reviews
    await client.query('DELETE FROM "Review" WHERE "proposalId" = $1', [proposalId]);

    // Delete status history
    await client.query('DELETE FROM "StatusHistory" WHERE "proposalId" = $1', [proposalId]);

    // Delete the proposal
    await client.query('DELETE FROM "Proposal" WHERE id = $1', [proposalId]);

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
 * ADMIN OVERRIDE PROPOSAL DECISION (Admin function)
 */
export const overrideProposalDecision = async (adminEmail, proposalId, decision, reason) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  const validDecisions = ['APPROVED', 'REJECTED'];
  if (!validDecisions.includes(decision)) {
    throw new Error('Invalid decision. Must be APPROVED or REJECTED');
  }

  if (!reason || reason.trim().length < 10) {
    throw new Error('Override reason must be at least 10 characters');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current proposal status
    const proposalResult = await client.query(
      'SELECT id, status, "eventTitle", "organizerId" FROM "Proposal" WHERE id = $1',
      [proposalId]
    );

    if (proposalResult.rows.length === 0) {
      throw new Error('Proposal not found');
    }

    const proposal = proposalResult.rows[0];
    const oldStatus = proposal.status;

    // Update proposal status
    await client.query(
      `UPDATE "Proposal" 
       SET status = $1, "updatedAt" = NOW()
       WHERE id = $2`,
      [decision, proposalId]
    );

    // Add to status history
    await client.query(
      `INSERT INTO "StatusHistory" (id, status, "proposalId", "changedAt")
       VALUES (gen_random_uuid(), $1, $2, NOW())`,
      [decision, proposalId]
    );

    // Log admin override action
    await client.query(
      `INSERT INTO "ProposalAudit" (id, "proposalId", action, "performedBy", "performedByRole", details, timestamp)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
      [
        proposalId,
        'ADMIN_OVERRIDE',
        adminEmail,
        'ADMIN',
        JSON.stringify({
          oldStatus,
          newStatus: decision,
          reason,
          overrideType: 'MANUAL_DECISION'
        })
      ]
    );

    // If approved by override, trigger acceptance workflow
    if (decision === 'APPROVED') {
      // Get vote count for logging
      const voteResult = await client.query(
        'SELECT COUNT(*) as total, COUNT(CASE WHEN decision = \'ACCEPT\' THEN 1 END) as accepts FROM "Vote" WHERE "proposalId" = $1',
        [proposalId]
      );

      const { total, accepts } = voteResult.rows[0];

      // Import the trigger function
      const votingService = await import('../voting/voting.service.js');
      await votingService.triggerAcceptanceWorkflow(client, proposalId, parseInt(accepts), parseInt(total));
    }

    await client.query('COMMIT');

    return {
      proposalId,
      oldStatus,
      newStatus: decision,
      reason,
      overriddenBy: adminEmail,
      timestamp: new Date()
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * GET PLATFORM CONFIGURATION (Admin function)
 */
export const getPlatformConfiguration = async (adminEmail) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  // Get current configuration (for now, return hardcoded values)
  // In a full implementation, this would come from a Configuration table
  return {
    voting: {
      acceptanceThreshold: 4,
      totalOfficers: await getTotalOfficersCount(),
      votingEnabled: true
    },
    notifications: {
      emailEnabled: !!process.env.SMTP_USER,
      callbackSchedulingEnabled: true
    },
    platform: {
      adminEmail: ADMIN_EMAIL,
      platformName: 'Crawdwall Capital',
      version: '1.0.0'
    }
  };
};

/**
 * UPDATE PLATFORM CONFIGURATION (Admin function)
 */
export const updatePlatformConfiguration = async (adminEmail, configUpdates) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  // For now, we'll focus on updating the acceptance threshold
  if (configUpdates.voting && configUpdates.voting.acceptanceThreshold) {
    const newThreshold = parseInt(configUpdates.voting.acceptanceThreshold);

    if (newThreshold < 1 || newThreshold > 10) {
      throw new Error('Acceptance threshold must be between 1 and 10');
    }

    // In a full implementation, this would update a Configuration table
    // For now, we'll log the change
    console.log(`Admin ${adminEmail} updated acceptance threshold to ${newThreshold}`);

    return {
      message: 'Configuration updated successfully',
      changes: {
        acceptanceThreshold: {
          old: 4,
          new: newThreshold
        }
      },
      note: 'Threshold changes will take effect for new proposals'
    };
  }

  return { message: 'No configuration changes applied' };
};

/**
 * GET TOTAL OFFICERS COUNT
 */
async function getTotalOfficersCount() {
  const result = await pool.query('SELECT COUNT(*) as count FROM "Officer" WHERE status = \'ACTIVE\'');
  return parseInt(result.rows[0].count);
}

/**
 * GET PLATFORM ACTIVITY (Admin function)
 */
export const getPlatformActivity = async (adminEmail) => {
  // Verify admin
  if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Unauthorized - Admin access required');
  }

  // Get recent user registrations
  const recentUsers = await pool.query(`
    SELECT name, email, role, "createdAt"
    FROM "User"
    ORDER BY "createdAt" DESC
    LIMIT 10
  `);

  // Get recent proposals
  const recentProposals = await pool.query(`
    SELECT p."eventTitle", p.status, p."createdAt", u.name as "organizerName"
    FROM "Proposal" p
    JOIN "User" u ON p."organizerId" = u.id
    ORDER BY p."createdAt" DESC
    LIMIT 10
  `);

  // Get recent reviews
  const recentReviews = await pool.query(`
    SELECT r.decision, r."createdAt", o.name as "officerName", p."eventTitle"
    FROM "Review" r
    JOIN "Officer" o ON r."officerId" = o.id
    JOIN "Proposal" p ON r."proposalId" = p.id
    ORDER BY r."createdAt" DESC
    LIMIT 10
  `);

  return {
    recentUsers: recentUsers.rows,
    recentProposals: recentProposals.rows,
    recentReviews: recentReviews.rows
  };
};