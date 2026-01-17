# Super Admin OTP Authentication (Fully Updated)

## Overview

Implementation of a secure OTP-based authentication system where a single super admin can send OTPs to various admin emails. The super admin controls access by sending OTPs to authorized admin emails who can then verify the OTP to gain access. All admin authorizations are permanently stored in the database.

## Features

- **Single Super Admin**: Only one designated email acts as super admin
- **Dynamic Admin Authorization**: Super admin can send OTPs to any admin email
- **Database Storage**: All authorized admin emails are permanently stored in the database
- **Admin Management**: Super admin can add, activate, or suspend admin accounts
- **Secure OTP Generation**: Time-limited OTP codes with configurable expiry
- **Rate Limiting**: Protection against brute-force attacks
- **Email Delivery**: OTP sent via email using nodemailer
- **Session Management**: JWT token generation upon successful OTP verification

## Database Models

### Admin Model

- `id`: Unique identifier for the admin
- `email`: Admin email address (unique)
- `name`: Optional admin name
- `status`: AdminStatus (ACTIVE, INACTIVE, SUSPENDED)
- `createdBy`: Email of the super admin who created this admin
- `createdAt`: Timestamp when admin was created
- `updatedAt`: Timestamp when admin was last updated

### AdminStatus Enum

- `ACTIVE`: Admin can log in and perform actions
- `INACTIVE`: Admin account is inactive
- `SUSPENDED`: Admin account is suspended

## Configuration

### Super Admin Email

Located in `src/config/admin.config.js`:

```javascript
export const SUPER_ADMIN_EMAIL = "thiscrawdwallcapital@gmail.com";

// Temporary authorized admin emails for development
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

### 1. Super Admin Adds Admin User

**Endpoint**: `POST /auth/admin/add-admin`

**Description**: Super admin adds/activates an admin user account.

**Request Body**:

```json
{
  "superAdminEmail": "thiscrawdwallcapital@gmail.com",
  "adminEmail": "newadmin@example.com",
  "adminName": "John Doe"
}
```

**Success Response (200)**:

```json
{
  "success": true,
  "message": "Admin email newadmin@example.com authorized successfully",
  "admin": {
    "id": "uuid",
    "email": "newadmin@example.com",
    "name": "John Doe",
    "status": "ACTIVE",
    "createdBy": "thiscrawdwallcapital@gmail.com",
    "createdAt": "2026-01-15T09:30:00.000Z",
    "updatedAt": "2026-01-15T09:30:00.000Z"
  }
}
```

**Error Response (400)**:

```json
{
  "message": "Only super admin can add other admin users"
}
```

### 2. Super Admin Sends OTP to Admin

**Endpoint**: `POST /auth/admin/request-otp`

**Description**: Super admin sends an OTP to a target admin email (automatically adds to database).

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

### 3. Admin Verifies OTP

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

- Only the designated super admin email can add/authorize other admin emails
- Case-insensitive comparison

### OTP Security

- 6-digit numeric codes
- 10-minute expiry time
- Maximum 3 attempts before temporary blocking
- Automatic cleanup of expired OTPs

### Rate Limiting

- Blocks accounts after 3 failed attempts for 30 minutes
- Prevents brute-force attacks

### Database Security

- Admin accounts stored securely in database
- Status management (active/inactive/suspended)
- Audit trail of who authorized each admin

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

1. Super admin adds admin via `/auth/admin/add-admin` (optional but recommended)
2. OR Super admin sends OTP via `/auth/admin/request-otp` (automatically adds to DB)
3. System validates the request is from the super admin
4. Admin email is stored/updated in the database
5. Generate and store OTP for the target admin email
6. Send OTP to target admin's email
7. Admin verifies OTP to receive JWT token

## Error Handling

- Unauthorized super admin: Returns 400 with "Only super admin can add other admin users"
- Expired OTP: Returns 400 with "OTP has expired"
- Invalid OTP: Returns 400 with remaining attempts
- Blocked account: Returns 400 with blocking message
- Missing fields: Returns 400 with field requirements

## Integration with Existing System

- Works alongside existing user registration/login
- Generates ADMIN role JWT tokens
- Compatible with existing role-based middleware
- Maintains same response format as existing auth system
- All admin authorizations are permanently stored in database

## Future Enhancements

- Admin panel for managing admin accounts
- Redis storage for OTPs in production environments
- SMS OTP delivery option
- Backup authentication methods
- Audit logging for admin access
- Session management features

## Testing

To test the functionality:

1. Ensure the super admin email is configured correctly
2. Make a POST request to `/auth/admin/add-admin` to add an admin account (optional)
3. OR make a POST request to `/auth/admin/request-otp` with super admin email and target admin email
4. The target admin receives the OTP in their email
5. Admin makes POST request to `/auth/admin/verify-otp` with email and OTP
6. Use the returned token for admin access

## Security Recommendations

- Use strong SMTP credentials with app passwords
- Regularly rotate SMTP credentials
- Monitor admin access logs
- Consider IP whitelisting for admin access
- Implement additional 2FA for critical operations
