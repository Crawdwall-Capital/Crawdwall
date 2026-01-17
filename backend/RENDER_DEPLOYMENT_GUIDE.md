# 🚀 Render Deployment Guide - Crawdwall Backend

## 📋 Prerequisites

Before deploying to Render, ensure you have:
- ✅ GitHub repository with your code
- ✅ Render account (free tier available)
- ✅ All files committed and pushed to GitHub

---

## 🎯 Deployment Options

### Option 1: Blueprint Deployment (Recommended)
Use the `render.yaml` file for automated setup.

### Option 2: Manual Setup
Configure services manually through Render dashboard.

---

## 🔧 Option 1: Blueprint Deployment

### Step 1: Connect Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository: `Crawdwall-Capital/Crawdwall`
4. Select the repository and branch (`main`)

### Step 2: Configure Blueprint
1. Render will detect the `render.yaml` file
2. Review the configuration:
   - **Web Service**: `crawdwall-backend`
   - **Database**: `crawdwall-db` (PostgreSQL)
   - **Plan**: Free tier
3. Click **"Apply"**

### Step 3: Environment Variables (Auto-configured)
The blueprint automatically sets:
- `NODE_ENV=production`
- `PORT=10000`
- `DATABASE_URL` (from database)
- `JWT_SECRET` (auto-generated)
- `SUPER_ADMIN_EMAIL=thiscrawdwallcapital@gmail.com`

---

## 🔧 Option 2: Manual Setup

### Step 1: Create Database
1. Go to Render Dashboard
2. Click **"New"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `crawdwall-db`
   - **Database**: `crawdwall`
   - **User**: `crawdwall_user`
   - **Plan**: Free
4. Click **"Create Database"**
5. **Save the connection details** (you'll need them)

### Step 2: Create Web Service
1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `crawdwall-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Set Environment Variables
In the web service settings, add:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://crawdwall_user:password@host:port/crawdwall
JWT_SECRET=your_strong_jwt_secret_here
SUPER_ADMIN_EMAIL=thiscrawdwallcapital@gmail.com
```

**Important**: Get the actual `DATABASE_URL` from your database's connection info.

---

## 🔑 Environment Variables Reference

| Variable | Value | Source |
|----------|-------|--------|
| `NODE_ENV` | `production` | Manual |
| `PORT` | `10000` | Render default |
| `DATABASE_URL` | `postgresql://...` | From database |
| `JWT_SECRET` | Strong random string | Generate secure |
| `SUPER_ADMIN_EMAIL` | `thiscrawdwallcapital@gmail.com` | Manual |

### Generate JWT Secret
```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 64

# Option 3: Online generator
# https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

---

## 📦 Files Added for Deployment

### Required Files
- ✅ `render.yaml` - Blueprint configuration
- ✅ `Dockerfile` - Container configuration (optional)
- ✅ `.dockerignore` - Docker ignore rules
- ✅ `.env.production` - Production environment template

### Updated Files
- ✅ `package.json` - Added production scripts
- ✅ Existing source code (no changes needed)

---

## 🚀 Deployment Process

### What Happens During Deployment
1. **Build Phase**:
   - Render clones your repository
   - Runs `npm install`
   - Installs dependencies

2. **Migration Phase**:
   - Runs `npm run migrate` (postinstall script)
   - Creates database tables
   - Sets up schema

3. **Start Phase**:
   - Runs `npm start`
   - Starts server on port 10000
   - Health check at `/health`

### Expected Timeline
- **Database**: 2-3 minutes
- **Web Service**: 5-10 minutes
- **Total**: ~10-15 minutes

---

## 🔍 Verification Steps

### 1. Check Deployment Status
- Database: Should show "Available"
- Web Service: Should show "Live"

### 2. Test Health Endpoint
```bash
curl https://your-app-name.onrender.com/health
```
Expected response:
```json
{"status":"OK","message":"Server is running"}
```

### 3. Test API Endpoints
```bash
# Test registration
curl -X POST https://your-app-name.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phoneNumber": "+1234567890",
    "password": "TestPass123!",
    "role": "ORGANIZER"
  }'
```

---

## 🎯 Post-Deployment Setup

### 1. Update Postman Collection
- Change `baseUrl` from `http://localhost:3000` to `https://your-app-name.onrender.com`
- Test all endpoints

### 2. Custom Domain (Optional)
1. Go to your web service settings
2. Click **"Custom Domains"**
3. Add your domain (e.g., `api.crawdwall.com`)
4. Configure DNS records

### 3. Environment-Specific URLs
- **Production**: `https://your-app-name.onrender.com`
- **Local Development**: `http://localhost:3000`

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Fails
```
Error: Cannot find module 'xyz'
```
**Solution**: Check `package.json` dependencies

#### 2. Database Connection Fails
```
Error: Connection refused
```
**Solutions**:
- Verify `DATABASE_URL` is correct
- Check database is "Available"
- Ensure SSL is enabled in connection

#### 3. Health Check Fails
```
Service unhealthy
```
**Solutions**:
- Check server starts on correct port (`process.env.PORT`)
- Verify `/health` endpoint exists
- Check application logs

#### 4. Migration Fails
```
Error: relation "User" does not exist
```
**Solutions**:
- Check `run-migrations.js` runs correctly
- Verify `create-tables.sql` is included
- Check database permissions

### Debugging Steps

#### 1. Check Logs
```bash
# In Render dashboard
Go to your service → Logs tab
```

#### 2. Test Locally First
```bash
# Set production-like environment
export NODE_ENV=production
export PORT=10000
npm start
```

#### 3. Verify Environment Variables
```bash
# In Render dashboard
Go to service → Environment tab
```

---

## 📊 Render Free Tier Limits

### Web Service
- **Hours**: 750 hours/month
- **Sleep**: After 15 minutes of inactivity
- **Wake**: ~30 seconds cold start
- **Bandwidth**: 100GB/month

### Database
- **Storage**: 1GB
- **Connections**: 97 concurrent
- **Backup**: 90 days retention

### Recommendations
- Use for development/testing
- Upgrade to paid plan for production
- Monitor usage in dashboard

---

## 🎉 Success Checklist

After successful deployment:

- [ ] Database is "Available"
- [ ] Web service is "Live"
- [ ] Health check returns 200 OK
- [ ] Registration endpoint works
- [ ] Login endpoint works
- [ ] Database tables exist
- [ ] Environment variables set correctly
- [ ] Custom domain configured (optional)
- [ ] Postman collection updated
- [ ] API documentation updated with new URL

---

## 🔗 Useful Links

- **Render Dashboard**: https://dashboard.render.com
- **Render Docs**: https://render.com/docs
- **Node.js on Render**: https://render.com/docs/node-express-app
- **PostgreSQL on Render**: https://render.com/docs/databases

---

## 📞 Support

### If Deployment Fails
1. Check the deployment logs in Render dashboard
2. Verify all environment variables are set
3. Test the build process locally
4. Check GitHub repository has all required files

### Common Commands
```bash
# Local testing with production settings
NODE_ENV=production PORT=10000 npm start

# Test database migration
npm run migrate

# Test health endpoint
curl http://localhost:10000/health
```

---

## 🎯 Next Steps After Deployment

1. **Update Documentation**: Change API URLs in README
2. **Test All Endpoints**: Use Postman with new base URL
3. **Monitor Performance**: Check Render dashboard regularly
4. **Set Up Monitoring**: Consider external monitoring tools
5. **Plan Scaling**: Upgrade to paid plans when needed

---

**Your Crawdwall API will be live at**: `https://your-app-name.onrender.com` 🚀

*Deployment typically takes 10-15 minutes. The free tier may have cold starts after 15 minutes of inactivity.*