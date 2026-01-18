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
    `INSERT INTO "OTP" (id, email, otp, "expiresAt", used, "createdAt")
     VALUES (gen_random_uuid(), $1, $2, $3, false, NOW())`,
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
    `SELECT id, otp, "expiresAt", used 
     FROM "OTP" 
     WHERE email = $1 AND otp = $2 AND used = false 
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

  // Mark OTP as used
  await pool.query(
    'UPDATE "OTP" SET used = true WHERE id = $1',
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