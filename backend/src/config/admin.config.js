// Admin configuration (overall platform manager)
// This is the main admin email that uses OTP login
export const ADMIN_EMAIL = 'thiscrawdwallcapital@gmail.com';

// Officer Configuration (review staff created by admin)
export const OFFICER_CONFIG = {
  defaultStatus: 'ACTIVE',
  maxLoginAttempts: 5,
  passwordMinLength: 8
};

// OTP Configuration (for Admin login only)
export const OTP_CONFIG = {
  length: 6,                    // Length of OTP code
  expiryMinutes: 10,            // OTP expiry time in minutes
  maxAttempts: 3,               // Maximum OTP attempts before blocking
  resendCooldownSeconds: 60     // Cooldown period before resending OTP
};