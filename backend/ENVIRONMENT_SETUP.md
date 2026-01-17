# 🔐 Environment Setup Guide

## Required Environment Variables

Before running the application, you need to set up your environment variables.

### 1. Copy the Example File
```bash
cp .env.example .env
```

### 2. Fill in Your Values

Edit the `.env` file with your actual values:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database_name"

# JWT Configuration  
JWT_SECRET="your_strong_jwt_secret_here"

# Server Configuration
PORT=3000

# Admin Configuration
SUPER_ADMIN_EMAIL="your_admin_email@example.com"
```

## 🔑 How to Generate Secure Values

### JWT Secret
Generate a strong JWT secret:
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64

# Option 3: Online generator
# Visit: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

### Database URL Format
```
postgresql://username:password@host:port/database_name
```

**For Render PostgreSQL:**
- Get the connection string from your Render dashboard
- It should look like: `postgresql://user:pass@host.render.com/dbname`

## 🚨 Security Notes

### ⚠️ NEVER commit these files:
- `.env` - Contains your actual secrets
- `*.db` - Local database files
- `uploads/` - May contain user files
- `node_modules/` - Dependencies

### ✅ Safe to commit:
- `.env.example` - Template without real values
- Source code files (they use `process.env.VARIABLE`)
- Documentation files

## 🔍 Verification

Test your environment setup:

```bash
# 1. Check if environment loads
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')"

# 2. Test database connection
npm run test:db

# 3. Start the server
npm start
```

## 📝 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✅ Yes | Secret for JWT token signing | `your_64_char_secret_here` |
| `PORT` | ❌ No | Server port (default: 3000) | `3000` |
| `SUPER_ADMIN_EMAIL` | ✅ Yes | Super admin email for OTP | `admin@yourcompany.com` |
| `SMTP_HOST` | ❌ No | Email server host | `smtp.gmail.com` |
| `SMTP_PORT` | ❌ No | Email server port | `587` |
| `SMTP_USER` | ❌ No | Email username | `your_email@gmail.com` |
| `SMTP_PASS` | ❌ No | Email password/app password | `your_app_password` |
| `NODE_ENV` | ❌ No | Environment mode | `development` or `production` |

## 🚀 Quick Setup for Development

```bash
# 1. Clone and install
git clone <your-repo>
cd backend
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Setup database
npm run migrate

# 4. Start development server
npm run dev
```

## 🔧 Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Check if the database server is running
- Ensure SSL settings match your provider

### JWT Token Issues
- Make sure `JWT_SECRET` is set and not empty
- Use a strong secret (at least 32 characters)
- Don't use spaces or special characters that might cause issues

### Port Issues
- Check if port 3000 is already in use
- Change `PORT` in `.env` if needed
- Kill any existing Node processes: `pkill node`

## 📞 Need Help?

1. Check the logs for specific error messages
2. Verify all required environment variables are set
3. Test database connection separately
4. Ensure your `.env` file is in the correct location (backend root)

---

**Remember: Never share your `.env` file or commit it to version control!**