// Admin configuration (overall platform overseer)
// This is the main admin email that uses OTP login - was previously "Super Admin"
export const ADMIN_EMAIL = 'crawdwallcapital@gmail.com';

// Officer Configuration (review staff created by admin - was previously "Admin")
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