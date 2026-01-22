# SendGrid Setup (Alternative to Gmail)

If Gmail SMTP is blocked by Render, use SendGrid instead:

## Step 1: Create SendGrid Account
1. Go to https://sendgrid.com/
2. Sign up for free account (100 emails/day free)
3. Verify your email

## Step 2: Create API Key
1. Go to Settings > API Keys
2. Click "Create API Key"
3. Choose "Restricted Access"
4. Give it "Mail Send" permissions
5. Copy the API key (starts with SG.)

## Step 3: Update Environment Variables
Replace Gmail SMTP with SendGrid:

```env
# SendGrid Configuration (Alternative to Gmail)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key_here
```

## Step 4: Verify Domain (Optional)
1. In SendGrid, go to Settings > Sender Authentication
2. Add your domain or use Single Sender Verification
3. Verify crawdwallcapital@gmail.com as sender

SendGrid is more reliable with cloud hosting providers like Render.