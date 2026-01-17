import crypto from 'crypto';
import { OTP_CONFIG, SUPER_ADMIN_EMAIL } from '../../config/admin.config.js';
import pool from '../../config/prisma.js';

// In-memory storage for OTPs (in production, use Redis or database)
const otpStore = new Map();

// Generate a random OTP code
export const generateOTP = () => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP_CONFIG.length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Store OTP with expiry
export const storeOTP = async (email, otp) => {
  const expiryTime = new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60 * 1000);

  // Clear any existing OTP for this email
  otpStore.delete(email);

  // Store new OTP
  otpStore.set(email, {
    otp,
    expiresAt: expiryTime,
    attempts: 0,
    blocked: false,
    createdAt: new Date()
  });

  // Also store in database for persistence
  try {
    await pool.query(
      `INSERT INTO "OTP" (id, email, otp, "expiresAt", attempts, blocked, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, 0, false, NOW(), NOW())`,
      [email, otp, expiryTime]
    );

    // Delete any old OTPs for this email
    await pool.query(
      `DELETE FROM "OTP" WHERE email = $1 AND id != (
        SELECT id FROM "OTP" WHERE email = $1 ORDER BY "createdAt" DESC LIMIT 1
      )`,
      [email]
    );
  } catch (error) {
    console.error('Error storing OTP in database:', error);
    // Continue anyway since we have in-memory storage
  }

  return expiryTime;
};

// Verify OTP
export const verifyOTP = async (email, otp) => {
  let otpRecord = otpStore.get(email);

  // If not in memory, check database
  if (!otpRecord) {
    const result = await pool.query(
      'SELECT otp, "expiresAt", attempts, blocked FROM "OTP" WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return { valid: false, message: 'Invalid or expired OTP' };
    }

    const dbRecord = result.rows[0];

    // Store in memory for faster access next time
    otpRecord = {
      otp: dbRecord.otp,
      expiresAt: new Date(dbRecord.expiresAt),
      attempts: dbRecord.attempts,
      blocked: dbRecord.blocked
    };
    otpStore.set(email, otpRecord);
  }

  const storedOTP = otpStore.get(email);

  // Check if OTP is blocked
  if (storedOTP.blocked) {
    return { valid: false, message: 'Account temporarily blocked due to multiple failed attempts' };
  }

  // Check if OTP has expired
  if (new Date() > storedOTP.expiresAt) {
    otpStore.delete(email);
    await pool.query('DELETE FROM "OTP" WHERE email = $1', [email]);
    return { valid: false, message: 'OTP has expired' };
  }

  // Check if OTP is valid
  if (storedOTP.otp === otp) {
    // Valid OTP - remove it from store
    otpStore.delete(email);
    await pool.query('DELETE FROM "OTP" WHERE email = $1', [email]);
    return { valid: true, message: 'OTP verified successfully' };
  } else {
    // Invalid OTP - increment attempts
    storedOTP.attempts += 1;

    if (storedOTP.attempts >= OTP_CONFIG.maxAttempts) {
      storedOTP.blocked = true;
      storedOTP.blockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Block for 30 minutes
    }

    // Update in database
    await pool.query(
      'UPDATE "OTP" SET attempts = $1, blocked = $2, "updatedAt" = NOW() WHERE email = $3',
      [storedOTP.attempts, storedOTP.blocked, email]
    );

    const remainingAttempts = OTP_CONFIG.maxAttempts - storedOTP.attempts;
    if (remainingAttempts <= 0) {
      return { valid: false, message: 'Account blocked due to multiple failed attempts. Please try again later.' };
    }

    return { valid: false, message: `Invalid OTP. ${remainingAttempts} attempts remaining.` };
  }
};

// Check if email is the super admin email
export const isSuperAdminEmail = (email) => {
  return SUPER_ADMIN_EMAIL === email.toLowerCase();
};

// Check if email is an authorized admin email
export const isAuthorizedAdminEmail = async (email) => {
  // Check database for authorized admin
  try {
    const result = await pool.query(
      'SELECT id FROM "Admin" WHERE email = $1 AND status = $2',
      [email.toLowerCase(), 'ACTIVE']
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking admin authorization:', error);
    return false;
  }
};

// Authorize an admin email (to be called by super admin)
export const authorizeAdminEmail = async (superAdminEmail, adminEmail, adminName = null) => {
  // First verify this is coming from the super admin
  if (!isSuperAdminEmail(superAdminEmail)) {
    throw new Error('Only super admin can authorize new admin emails');
  }

  // Create or update admin record in database
  try {
    const result = await pool.query(
      `INSERT INTO "Admin" (id, email, name, status, "createdBy", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'ACTIVE', $3, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET
         status = 'ACTIVE',
         "updatedAt" = NOW()
       RETURNING *`,
      [adminEmail.toLowerCase(), adminName, superAdminEmail.toLowerCase()]
    );

    return {
      success: true,
      message: `Admin email ${adminEmail} authorized successfully`,
      admin: result.rows[0]
    };
  } catch (error) {
    console.error('Error authorizing admin email:', error);
    throw new Error('Failed to authorize admin email');
  }
};

// Get OTP for email (for testing purposes)
export const getOTPByEmail = (email) => {
  return otpStore.get(email)?.otp || null;
};

// Clear OTP for email
export const clearOTP = async (email) => {
  otpStore.delete(email);
  await pool.query('DELETE FROM "OTP" WHERE email = $1', [email]);
};