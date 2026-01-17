# Super Admin OTP Authentication

## Overview

Implementation of a secure OTP-based authentication system for super administrators. Only predefined admin emails can request and verify OTP codes to gain access to the admin panel.

## Features

- **Predefined Admin Emails**: Only authorized emails can request OTP
- **Secure OTP Generation**: Time-limited OTP codes with configurable expiry
- **Rate Limiting**: Protection against brute-force attacks
- **Email Delivery**: OTP sent via email using nodemailer
- **Session Management**: JWT token generation upon successful OTP verification

## Configuration

### Super Admin Emails

Located in `src/config/admin.config.js`:

```javascript
export const SUPER_ADMIN_EMAILS = [
  "thiscrawdwallcapital@gmail.com",
  // Add more super admin emails here as needed
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

### 1. Request Admin OTP

**Endpoint**: `POST /auth/admin/request-otp`

**Description**: Requests an OTP to be sent to a super admin email.

**Request Body**:

```json
{
  "email": "thiscrawdwallcapital@gmail.com"
}
```

**Success Response (200)**:

```json
{
  "message": "OTP sent successfully to your email",
  "email": "ijidolamichaelidowu@gmail.com"
}
```

**Error Response (400)**:

```json
{
  "message": "Email not authorized for admin access"
}
```

### 2. Verify Admin OTP

**Endpoint**: `POST /auth/admin/verify-otp`

**Description**: Verifies the OTP and returns a JWT token for admin access.

**Request Body**:

```json
{
  "email": "thiscrawdwallcapital@gmail.com",
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

### Email Validation

- Only emails in the `SUPER_ADMIN_EMAILS` list can request OTP
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

### Verification Flow

1. Check if email is in super admin list
2. Generate and store OTP with expiry time
3. Send OTP via email
4. Verify OTP when user submits
5. Generate JWT token upon successful verification

## Error Handling

- Invalid email: Returns 400 with "Email not authorized for admin access"
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

- Redis storage for OTPs in production environments
- SMS OTP delivery option
- Backup authentication methods
- Audit logging for admin access
- Session management features

## Testing

To test the functionality:

1. Ensure the email is in the SUPER_ADMIN_EMAILS list
2. Make a POST request to `/auth/admin/request-otp` with the email
3. Check your email for the OTP
4. Make a POST request to `/auth/admin/verify-otp` with email and OTP
5. Use the returned token for admin access

## Security Recommendations

- Use strong SMTP credentials with app passwords
- Regularly rotate SMTP credentials
- Monitor admin access logs
- Consider IP whitelisting for admin access
- Implement additional 2FA for critical operations
