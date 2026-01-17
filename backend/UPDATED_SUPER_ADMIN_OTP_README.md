# Super Admin OTP Authentication (Updated)

## Overview

Implementation of a secure OTP-based authentication system where a single super admin can send OTPs to various admin emails. The super admin controls access by sending OTPs to authorized admin emails who can then verify the OTP to gain access.

## Features

- **Single Super Admin**: Only one designated email acts as super admin
- **Dynamic Admin Authorization**: Super admin can send OTPs to any admin email
- **Secure OTP Generation**: Time-limited OTP codes with configurable expiry
- **Rate Limiting**: Protection against brute-force attacks
- **Email Delivery**: OTP sent via email using nodemailer
- **Session Management**: JWT token generation upon successful OTP verification

## Configuration

### Super Admin Email

Located in `src/config/admin.config.js`:

```javascript
export const SUPER_ADMIN_EMAIL = "thiscrawdwallcapital@gmail.com";

// Authorized admin emails that can receive OTPs from super admin
// These are managed dynamically, not hardcoded
export const AUTHORIZED_ADMIN_EMAILS = [];

// For development/testing purposes, you can temporarily add emails here
// In production, this should be managed through the admin panel
export const TEMP_AUTHORIZED_ADMINS = [
  "jw202185@gmail.com", // Example admin email
];
```

### OTP Settings

Also in `src/config/admin.config.js`:

```javascript
export const OTP_CONFIG = {
  length: 6, // Length of OTP code
  expiryMinutes: 10, // OTP expiry time in minutes
  maxAttempts: 3, // Maximum OTP attempts before blocking
  resendCooldownSeconds: 60, // Cooldown period before resending OTP
};
```

### Email Configuration

Environment variables needed in `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## API Endpoints

### 1. Super Admin Sends OTP to Admin

**Endpoint**: `POST /auth/admin/request-otp`

**Description**: Super admin sends an OTP to a target admin email.

**Request Body**:

```json
{
  "superAdminEmail": "thiscrawdwallcapital@gmail.com",
  "adminEmail": "jw202185@gmail.com"
}
```

**Success Response (200)**:

```json
{
  "message": "OTP sent successfully to admin email",
  "adminEmail": "jw202185@gmail.com"
}
```

**Error Response (400)**:

```json
{
  "message": "Only super admin can send OTP to other admin emails"
}
```

### 2. Admin Verifies OTP

**Endpoint**: `POST /auth/admin/verify-otp`

**Description**: Admin verifies the OTP they received and gets a JWT token for access.

**Request Body**:

```json
{
  "email": "jw202185@gmail.com",
  "otp": "123456"
}
```

**Success Response (200)**:

```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "role": "ADMIN"
}
```

**Error Response (400)**:

```json
{
  "message": "Invalid OTP. 2 attempts remaining."
}
```

## Security Features

### Super Admin Validation

- Only the designated super admin email can send OTPs to other emails
- Case-insensitive comparison

### OTP Security

- 6-digit numeric codes
- 10-minute expiry time
- Maximum 3 attempts before temporary blocking
- Automatic cleanup of expired OTPs

### Rate Limiting

- Blocks accounts after 3 failed attempts for 30 minutes
- Prevents brute-force attacks

### Email Delivery

- Uses nodemailer for sending OTPs
- Graceful degradation if email fails to send
- HTML-formatted emails with branding

## Implementation Details

### OTP Storage

- In-memory storage using Map for fast access
- Database backup using Prisma for persistence
- Automatic cleanup of expired entries

### Authorization Flow

1. Super admin makes request with their email and target admin email
2. System validates the request is from the super admin
3. Generate and store OTP for the target admin email
4. Send OTP to target admin's email
5. Admin verifies OTP to receive JWT token

## Error Handling

- Unauthorized super admin: Returns 400 with "Only super admin can send OTP to other admin emails"
- Expired OTP: Returns 400 with "OTP has expired"
- Invalid OTP: Returns 400 with remaining attempts
- Blocked account: Returns 400 with blocking message
- Missing fields: Returns 400 with field requirements

## Integration with Existing System

- Works alongside existing user registration/login
- Generates ADMIN role JWT tokens
- Compatible with existing role-based middleware
- Maintains same response format as existing auth system

## Future Enhancements

- Dynamic admin email management through admin panel
- Redis storage for OTPs in production environments
- SMS OTP delivery option
- Backup authentication methods
- Audit logging for admin access
- Session management features

## Testing

To test the functionality:

1. Ensure the super admin email is configured correctly
2. Make a POST request to `/auth/admin/request-otp` with super admin email and target admin email
3. The target admin receives the OTP in their email
4. Admin makes POST request to `/auth/admin/verify-otp` with email and OTP
5. Use the returned token for admin access

## Security Recommendations

- Use strong SMTP credentials with app passwords
- Regularly rotate SMTP credentials
- Monitor admin access logs
- Consider IP whitelisting for admin access
- Implement additional 2FA for critical operations
