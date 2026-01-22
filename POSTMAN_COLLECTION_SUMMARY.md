# Crawdwall API - Postman Collection Summary

## 📋 Collection Overview
**File**: `backend/Crawdwall_API_Final_Complete.postman_collection.json`

This collection contains all API endpoints for the Crawdwall event crowdfunding platform.

## 🔗 API Endpoints Included

### 1. Authentication & Registration
- **POST** `/api/auth/register` - Register Organizer/Investor
- **POST** `/api/auth/login` - Login for all users
- **GET** `/api/auth/me` - Get current user info
- **POST** `/api/auth/logout` - Logout

### 2. Admin Authentication (OTP-based)
- **POST** `/api/auth/admin/request-otp` - Request OTP for admin login
- **POST** `/api/auth/admin/verify-otp` - Verify OTP and get admin token

### 3. Organizer Proposals
- **POST** `/api/organizer/proposals` - Create proposal (with file upload)
- **GET** `/api/organizer/proposals` - Get organizer's proposals
- **GET** `/api/organizer/proposals/{id}` - Get specific proposal
- **PUT** `/api/organizer/proposals/{id}` - Update proposal
- **POST** `/api/organizer/proposals/{id}/submit` - Submit draft proposal
- **GET** `/api/organizer/proposals/{id}/history` - Get proposal history
- **GET** `/api/organizer/event-types` - Get available event types

### 4. Officer Management (Review Staff)
- **POST** `/api/officer/register` - Register new officer
- **POST** `/api/officer/login` - Officer login
- **GET** `/api/officer/proposals` - Get proposals for review
- **GET** `/api/officer/proposals/{id}` - Get proposal details
- **POST** `/api/officer/proposals/{id}/vote` - Vote on proposal
- **GET** `/api/officer/proposals/{id}/download/{filename}` - Download documents

### 5. Admin Management (Platform Control)
- **GET** `/api/admin/users` - Get all users
- **DELETE** `/api/admin/users/{id}` - Delete user
- **GET** `/api/admin/proposals` - Get all proposals
- **PUT** `/api/admin/proposals/{id}/status` - Update proposal status
- **GET** `/api/admin/officers` - Get all officers
- **POST** `/api/admin/officers` - Create officer
- **PUT** `/api/admin/officers/{id}` - Update officer
- **DELETE** `/api/admin/officers/{id}` - Delete officer

### 6. Investor Features
- **GET** `/api/investor/proposals` - Browse approved proposals
- **POST** `/api/investor/proposals/{id}/interest` - Express interest

## 🔧 Environment Variables
The collection uses these variables:
- `{{baseUrl}}` - API base URL (default: http://localhost:3000)
- `{{adminEmail}}` - Admin email (crawdwallcapital@gmail.com)

## 🚀 How to Use

### 1. Import Collection
1. Open Postman
2. Click "Import"
3. Select `backend/Crawdwall_API_Final_Complete.postman_collection.json`

### 2. Set Environment
1. Create new environment in Postman
2. Add variable: `baseUrl` = `http://localhost:3000` (for local) or your deployed URL

### 3. Authentication Flow
1. **Regular Users**: Use `/api/auth/register` then `/api/auth/login`
2. **Admin**: Use `/api/auth/admin/request-otp` then `/api/auth/admin/verify-otp`
3. Copy the token from login response
4. Add to Authorization header: `Bearer YOUR_TOKEN`

## 📝 Key Features
- ✅ Complete CRUD operations for all entities
- ✅ File upload support for proposal documents
- ✅ OTP-based admin authentication
- ✅ Role-based access control
- ✅ Voting system for officers
- ✅ Real-time notifications
- ✅ Comprehensive error handling

## 🔐 Security
- JWT token authentication
- Role-based authorization (ORGANIZER, INVESTOR, OFFICER, ADMIN)
- OTP verification for admin access
- Input validation and sanitization
- File upload restrictions (PDF, DOC, XLS only, 10MB max)

## 📧 Email Configuration
Admin OTP emails require SMTP configuration in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=crawdwallcapital@gmail.com
SMTP_PASS=your_gmail_app_password
```

## 🎯 Ready for Production
All endpoints tested and verified. The collection is production-ready and includes proper error handling, validation, and security measures.