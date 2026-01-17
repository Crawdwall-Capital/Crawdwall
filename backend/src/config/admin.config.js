// Super admin email configuration
// This is the super admin email that can send OTPs to other admin emails
export const SUPER_ADMIN_EMAIL = 'thiscrawdwallcapital@gmail.com';

// Authorized admin emails that can receive OTPs from super admin
// These are managed dynamically, not hardcoded
export const AUTHORIZED_ADMIN_EMAILS = [];

// For development/testing purposes, you can temporarily add emails here
// In production, this should be managed through the admin panel
export const TEMP_AUTHORIZED_ADMINS = [
  'jw202185@gmail.com'  // Example admin email
];

// OTP Configuration
export const OTP_CONFIG = {
  length: 6,                    // Length of OTP code
  expiryMinutes: 10,            // OTP expiry time in minutes
  maxAttempts: 3,               // Maximum OTP attempts before blocking
  resendCooldownSeconds: 60     // Cooldown period before resending OTP
};