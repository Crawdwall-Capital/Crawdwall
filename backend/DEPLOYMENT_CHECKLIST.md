# 🚀 Deployment Checklist - Crawdwall Backend

## ✅ Pre-Deployment Checklist

### Code & Repository
- [x] All code committed to GitHub
- [x] Repository is public or accessible to Render
- [x] Latest changes pushed to `main` branch
- [x] No sensitive data in repository (`.env` ignored)

### Required Files
- [x] `package.json` with correct scripts
- [x] `src/server.js` (entry point)
- [x] `render.yaml` (blueprint configuration)
- [x] `Dockerfile` (optional, for container deployment)
- [x] `.env.example` (environment template)
- [x] `run-migrations.js` (database setup)
- [x] `create-tables.sql` (database schema)

### Configuration
- [x] Server listens on `process.env.PORT`
- [x] Database connection uses `process.env.DATABASE_URL`
- [x] JWT secret uses `process.env.JWT_SECRET`
- [x] Super admin email configured
- [x] Health check endpoint at `/health`

---

## 🎯 Deployment Steps

### Option 1: Blueprint Deployment (Recommended)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Sign in or create account

2. **Create Blueprint**
   - Click "New" → "Blueprint"
   - Connect GitHub repository: `Crawdwall-Capital/Crawdwall`
   - Select branch: `main`

3. **Review Configuration**
   - Service name: `crawdwall-backend`
   - Database name: `crawdwall-db`
   - Plan: Free (or upgrade as needed)

4. **Deploy**
   - Click "Apply"
   - Wait 10-15 minutes for deployment

### Option 2: Manual Setup

1. **Create Database First**
   - New → PostgreSQL
   - Name: `crawdwall-db`
   - Plan: Free

2. **Create Web Service**
   - New → Web Service
   - Connect GitHub repo
   - Build: `npm install`
   - Start: `npm start`

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[from database connection info]
   JWT_SECRET=[generate strong secret]
   SUPER_ADMIN_EMAIL=thiscrawdwallcapital@gmail.com
   ```

---

## 🔧 Environment Variables Needed

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `10000` | Render default |
| `DATABASE_URL` | Auto-generated | From database |
| `JWT_SECRET` | Strong random string | Generate secure |
| `SUPER_ADMIN_EMAIL` | `thiscrawdwallcapital@gmail.com` | Your admin email |

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl https://your-app-name.onrender.com/health
```
Expected: `{"status":"OK","message":"Server is running"}`

### 2. Registration Test
```bash
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

### 3. Database Connection
- Check logs for "✓ Database connected successfully"
- Verify tables were created during migration

---

## 📦 What Gets Deployed

### Included Files
- All source code in `src/`
- `package.json` and dependencies
- Database migration scripts
- Upload directory structure
- Health check endpoint

### Excluded Files (via .gitignore)
- `.env` (local environment)
- `node_modules/` (rebuilt on server)
- Test files (`test-*.js`, `*.ps1`)
- Development files (`debug-*.js`)
- Documentation files (`*.md`)

---

## 🚨 Troubleshooting

### Common Issues

#### Build Fails
- Check `package.json` syntax
- Verify all dependencies are listed
- Check Node.js version compatibility

#### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check database is "Available" status
- Ensure SSL is properly configured

#### Health Check Fails
- Verify server starts on correct port
- Check `/health` endpoint exists
- Review application logs

#### Migration Fails
- Check `run-migrations.js` syntax
- Verify `create-tables.sql` is valid
- Check database permissions

### Debug Steps
1. Check deployment logs in Render dashboard
2. Verify environment variables are set
3. Test locally with production settings
4. Check database connection separately

---

## 📊 Expected Timeline

- **Database Creation**: 2-3 minutes
- **Web Service Build**: 5-8 minutes  
- **Migration & Start**: 2-3 minutes
- **Total**: 10-15 minutes

---

## 🎉 Success Indicators

### Deployment Complete When:
- [ ] Database shows "Available" status
- [ ] Web service shows "Live" status
- [ ] Health check returns 200 OK
- [ ] Registration endpoint works
- [ ] No errors in deployment logs
- [ ] Database tables exist

### Your API URL
After successful deployment: `https://your-app-name.onrender.com`

---

## 📝 Post-Deployment Tasks

1. **Update Postman Collection**
   - Change `baseUrl` to your Render URL
   - Test all 22 endpoints

2. **Update Documentation**
   - Replace localhost URLs with production URL
   - Update README with live API link

3. **Monitor Performance**
   - Check Render dashboard regularly
   - Monitor response times
   - Watch for cold starts (free tier)

4. **Set Up Custom Domain** (Optional)
   - Configure DNS records
   - Add custom domain in Render

---

## 🔗 Useful Resources

- **Render Dashboard**: https://dashboard.render.com
- **Your Repository**: https://github.com/Crawdwall-Capital/Crawdwall
- **Deployment Guide**: `RENDER_DEPLOYMENT_GUIDE.md`
- **API Documentation**: `Crawdwall_API_Complete.postman_collection.json`

---

## 📞 Need Help?

### If Deployment Fails:
1. Check the build logs in Render dashboard
2. Verify all files are committed to GitHub
3. Test the build process locally: `npm run build:check`
4. Check environment variables are set correctly

### Support Resources:
- Render Documentation: https://render.com/docs
- GitHub Issues: Create issue in your repository
- Render Community: https://community.render.com

---

**Ready to deploy? Follow the steps above and your Crawdwall API will be live in ~15 minutes!** 🚀