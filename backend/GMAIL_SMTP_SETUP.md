# Gmail SMTP Setup for Admin OTP Emails

## Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to "Security"
3. Enable "2-Step Verification" if not already enabled

## Step 2: Generate App Password
1. In Google Account settings, go to "Security"
2. Under "2-Step Verification", click "App passwords"
3. Select "Mail" as the app
4. Select "Other" as the device and name it "Crawdwall Backend"
5. Google will generate a 16-character app password
6. Copy this password (it will look like: `abcd efgh ijkl mnop`)

## Step 3: Update Environment Variables
Update your `.env` file with:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=crawdwallcapital@gmail.com
SMTP_PASS=your_16_character_app_password_here
```

**Important**: Replace `your_16_character_app_password_here` with the actual app password from Step 2.

## Step 4: Test OTP Email
1. Restart your backend server
2. Use the admin OTP request endpoint:
   ```
   POST /api/auth/admin/request-otp
   {
     "superAdminEmail": "crawdwallcapital@gmail.com",
     "adminEmail": "crawdwallcapital@gmail.com"
   }
   ```
3. Check your email for the OTP

## Alternative SMTP Providers
If you prefer not to use Gmail, you can use:

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your_mailgun_username
SMTP_PASS=your_mailgun_password
```

## Security Notes
- Never commit your actual SMTP password to version control
- Use environment variables for all sensitive data
- Consider using a dedicated email service for production