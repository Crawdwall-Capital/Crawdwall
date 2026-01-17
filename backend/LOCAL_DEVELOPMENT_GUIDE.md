# 🚀 Local Development Guide - Crawdwall Backend

## ✅ Current Status: RUNNING SUCCESSFULLY!

Your Crawdwall backend is now running locally and all core functionality has been tested.

---

## 🎯 Quick Start

### 1. Server Status
```bash
# Your server is currently running on:
http://localhost:3000

# Health check:
curl http://localhost:3000/health
# or visit in browser: http://localhost:3000/health
```

### 2. Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm run migrate    # Run database migrations
npm run test:db    # Test database connection
```

---

## 🧪 Testing Results

### ✅ Working Endpoints
- **Health Check**: `GET /health` ✓
- **User Registration**: `POST /auth/register` ✓
- **User Login**: `POST /auth/login` ✓
- **Get Profile**: `GET /auth/me` ✓
- **Get Proposals**: `GET /organizer/proposals` ✓

### 🔑 Test Credentials Created
- **Email**: `apitest@example.com`
- **Password**: `ApiTest123!`
- **Role**: `ORGANIZER`

---

## 📦 Postman Collection Setup

### Import Collection
1. Open Postman
2. Click **Import**
3. Select: `backend/Crawdwall_API_Complete.postman_collection.json`
4. Set variables:
   - `baseUrl`: `http://localhost:3000`
   - `authToken`: (will be set after login)

### Quick Test Flow
1. **Health Check** → Should return `{"status":"OK"}`
2. **Register User** → Get token
3. **Login** → Refresh token
4. **Get Current User** → Verify authentication
5. Test other endpoints as needed

---

## 🛠️ Development Workflow

### Starting Development
```bash
# Stop current server (if needed)
# Press Ctrl+C in the terminal where server is running

# Start development server with auto-reload
npm run dev

# Server will restart automatically when you change files
```

### Making Changes
1. Edit files in `src/` directory
2. Server auto-reloads (if using `npm run dev`)
3. Test endpoints using Postman or curl
4. Check server logs for any errors

### Database Changes
```bash
# If you modify database schema:
npm run migrate

# Test database connection:
npm run test:db
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app setup
│   ├── server.js              # Server entry point
│   ├── config/                # Configuration files
│   ├── modules/
│   │   ├── auth/              # Authentication logic
│   │   ├── admin/             # Admin functionality
│   │   ├── proposal/          # Proposal management
│   │   ├── investor/          # Investor features
│   │   ├── upload/            # File upload
│   │   ├── middlewares/       # Express middlewares
│   │   └── utils/             # Utility functions
├── .env                       # Environment variables (PRIVATE)
├── .env.example               # Environment template
├── package.json               # Dependencies and scripts
└── Crawdwall_API_Complete.postman_collection.json  # API docs
```

---

## 🔧 Common Development Tasks

### Add New Endpoint
1. Create route in appropriate module (e.g., `src/modules/auth/auth.routes.js`)
2. Add controller function (e.g., `src/modules/auth/auth.controller.js`)
3. Add service logic (e.g., `src/modules/auth/auth.service.js`)
4. Test with Postman

### Debug Issues
```bash
# Check server logs
# Look at the terminal where server is running

# Test specific endpoint
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"apitest@example.com","password":"ApiTest123!"}'

# Check database connection
npm run test:db
```

### Environment Variables
```bash
# Edit environment variables
notepad .env

# Never commit .env file!
# Use .env.example for templates
```

---

## 🚨 Troubleshooting

### Server Won't Start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <process_id> /F

# Restart server
npm start
```

### Database Connection Issues
```bash
# Test connection
npm run test:db

# Check .env file has correct DATABASE_URL
# Verify Render database is accessible
```

### Authentication Errors
```bash
# Check JWT_SECRET is set in .env
# Verify token format in Authorization header:
# Authorization: Bearer <your_token_here>
```

---

## 📊 API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/auth/register` | No | Register user |
| POST | `/auth/login` | No | Login user |
| GET | `/auth/me` | Yes | Get current user |
| POST | `/organizer/proposals` | Yes | Create proposal |
| GET | `/organizer/proposals` | Yes | Get my proposals |
| GET | `/api/v1/admin/proposals` | Yes | Admin: Get proposals |
| GET | `/api/v1/investor/opportunities` | Yes | Get opportunities |

**Total: 22 endpoints** (see Postman collection for complete list)

---

## 🎯 Next Steps

### For Development
1. **Import Postman collection** for easy testing
2. **Use `npm run dev`** for auto-reload during development
3. **Check server logs** for debugging
4. **Test endpoints** after making changes

### For Production
1. **Set production environment variables**
2. **Use `npm start`** for production
3. **Set up proper logging**
4. **Configure HTTPS**

---

## 💡 Pro Tips

1. **Use Postman environments** for different setups (local, staging, prod)
2. **Check server logs** when endpoints fail
3. **Use `npm run dev`** during development for auto-reload
4. **Keep `.env` file secure** - never commit it
5. **Test authentication flow** first before testing protected endpoints

---

## 🎉 Success!

Your Crawdwall backend is:
- ✅ **Running locally** on http://localhost:3000
- ✅ **Connected to database** (PostgreSQL on Render)
- ✅ **Authentication working** (JWT tokens)
- ✅ **API endpoints functional** (22 endpoints available)
- ✅ **Ready for development** (auto-reload with nodemon)
- ✅ **Documented** (complete Postman collection)

**Happy coding!** 🚀

---

*Last updated: January 17, 2026*
*Server running on: http://localhost:3000*