# 🚀 CRAWDWALL CAPITAL - PRODUCTION API DOCUMENTATION

## 📋 **API OVERVIEW**

**Production Base URL**: `https://crawdwall-backend-ywlk.onrender.com`  
**API Base URL**: `https://crawdwall-backend-ywlk.onrender.com/api`  
**Health Check**: `https://crawdwall-backend-ywlk.onrender.com/health`

## 🔐 **AUTHENTICATION SYSTEM**

### User Roles:
- **ORGANIZER**: Creates and manages event proposals
- **INVESTOR**: Views investment opportunities and expresses interest  
- **ADMIN**: Platform management with OTP authentication
- **OFFICER**: Reviews and votes on proposals with email/password auth

### Authentication Methods:
- **Users (Organizer/Investor)**: JWT tokens via email/password
- **Admin**: OTP-based authentication to `thiscrawdwallcapital@gmail.com`
- **Officer**: JWT tokens via email/password (created by Admin)

---

## 📚 **API ENDPOINTS**

### 🏥 **1. HEALTH & STATUS**

#### Health Check
```http
GET https://crawdwall-backend-ywlk.onrender.com/health
```
**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

### 🔐 **2. AUTHENTICATION**

#### Register User (Organizer/Investor)
```http
POST https://crawdwall-backend-ywlk.onrender.com/api/auth/register
Content-Type: application/json

{
  "name": "John Organizer",
  "email": "organizer@example.com", 
  "phoneNumber": "+1234567890",
  "password": "SecurePass123",
  "role": "ORGANIZER"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Registration successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "ORGANIZER"
  }
}
```

#### User Login
```http
POST https://crawdwall-backend-ywlk.onrender.com/api/auth/login
Content-Type: application/json

{
  "email": "organizer@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "ORGANIZER"
  }
}
```

---

### 👑 **3. ADMIN SYSTEM**

#### Request Admin OTP
```http
POST https://crawdwall-backend-ywlk.onrender.com/api/admin/request-otp
Content-Type: application/json

{
  "email": "thiscrawdwallcapital@gmail.com"
}
```

#### Verify Admin OTP
```http
POST https://crawdwall-backend-ywlk.onrender.com/api/admin/verify-otp
Content-Type: application/json

{
  "email": "thiscrawdwallcapital@gmail.com",
  "otp": "123456"
}
```

#### Create Officer (Admin Only)
```http
POST https://crawdwall-backend-ywlk.onrender.com/api/admin/officers
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "officer@example.com",
  "name": "John Officer", 
  "password": "OfficerPass123"
}
```

#### Get All Users (Admin Only)
```http
GET https://crawdwall-backend-ywlk.onrender.com/api/admin/users
Authorization: Bearer {admin_token}
```

#### Get All Proposals (Admin Only)
```http
GET https://crawdwall-backend-ywlk.onrender.com/api/admin/proposals
Authorization: Bearer {admin_token}
```

#### Admin Override Proposal (Admin Only)
```http
POST https://crawdwall-backend-ywlk.onrender.com/api/admin/proposals/{proposalId}/override
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "decision": "APPROVED",
  "reason": "Strategic importance to platform growth"
}
```

---

### 👮 **4. OFFICER SYSTEM (PRD VOTING)**

#### Officer Login
```http
POST https://crawdwall-backend-ywlk.onrender.com/api/officer/login
Content-Type: application/json

{
  "email": "officer@example.com",
  "password": "OfficerPass123"
}
```

#### Get Proposals for Review (Officer Only)
```http
GET https://crawdwall-backend-ywlk.onrender.com/api/officer/proposals
Authorization: Bearer {officer_token}
```

#### Get Proposal Details (Officer Only)
```http
GET https://crawdwall-backend-ywlk.onrender.com/api/officer/proposals/{proposalId}
Authorization: Bearer {officer_token}
```

#### Submit Vote on Proposal (Officer Only)
```http
POST https://crawdwall-backend-ywlk.onrender.com/api/officer/proposals/{proposalId}/vote
Authorization: Bearer {officer_token}
Content-Type: application/json

{
  "decision": "ACCEPT",
  "riskAssessment": "Low risk - well-planned event with experienced organizer",
  "revenueComment": "Revenue projections are realistic based on similar events", 
  "notes": "Excellent proposal with strong market potential"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Vote submitted successfully",
    "vote": {
      "id": "uuid-here",
      "decision": "ACCEPT",
      "submittedAt": "2026-01-20T00:00:00.000Z"
    },
    "proposalStatus": {
      "currentStatus": "UNDER_REVIEW",
      "acceptVotes": 3,
      "rejectVotes": 0,
      "requiredVotes": 4
    }
  }
}
```

#### Get Proposal Voting Information (Officer Only)
```http
GET https://crawdwall-backend-ywlk.onrender.com/api/officer/proposals/{proposalId}/votes
Authorization: Bearer {officer_token}
```

---

### 📋 **5. PROPOSAL MANAGEMENT**

#### Create Proposal (Organizer Only)
```http
POST https://crawdwall-backend-ywlk.onrender.com/api/organizer/proposals
Authorization: Bearer {organizer_token}
Content-Type: application/json

{
  "eventTitle": "Tech Innovation Conference 2024",
  "description": "A comprehensive technology conference featuring the latest innovations in AI, blockchain, and sustainable tech.",
  "expectedRevenue": 150000,
  "timeline": "8 months",
  "pitchVideoUrl": "https://youtube.com/watch?v=example"
}
```

#### Create Draft Proposal (Organizer Only)
```http
POST https://crawdwall-backend-ywlk.onrender.com/api/organizer/proposals
Authorization: Bearer {organizer_token}
Content-Type: application/json

{
  "eventTitle": "Draft Event Title",
  "description": "This is a draft proposal",
  "expectedRevenue": 50000,
  "timeline": "6 months",
  "isDraft": true
}
```

#### Get My Proposals (Organizer Only)
```http
GET https://crawdwall-backend-ywlk.onrender.com/api/organizer/proposals
Authorization: Bearer {organizer_token}
```

#### Get Proposal Details (Organizer Only)
```http
GET https://crawdwall-backend-ywlk.onrender.com/api/organizer/proposals/{proposalId}
Authorization: Bearer {organizer_token}
```

---

### 💰 **6. INVESTMENT SYSTEM**

#### Get Investment Opportunities (Investor Only)
```http
GET https://crawdwall-backend-ywlk.onrender.com/api/investor/opportunities
Authorization: Bearer {investor_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "id": "uuid-here",
        "eventTitle": "Tech Innovation Conference 2024",
        "description": "A comprehensive technology conference",
        "expectedRevenue": 150000,
        "timeline": "8 months",
        "status": "ACCEPTED",
        "organizerName": "John Organizer",
        "acceptedAt": "2026-01-20T00:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

#### Express Investment Interest (Investor Only)
```http
POST https://crawdwall-backend-ywlk.onrender.com/api/investor/interest
Authorization: Bearer {investor_token}
Content-Type: application/json

{
  "proposalId": "uuid-here",
  "eventType": "CONFERENCE",
  "investmentRange": "100000-200000",
  "notes": "Very interested in this tech conference. Great market potential."
}
```

#### Get My Investment Interests (Investor Only)
```http
GET https://crawdwall-backend-ywlk.onrender.com/api/investor/interests
Authorization: Bearer {investor_token}
```

---

### 📁 **7. FILE UPLOAD**

#### Upload File
```http
POST https://crawdwall-backend-ywlk.onrender.com/api/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [file_data]
type: "budget"
```

---

## 🎯 **PRD VOTING SYSTEM**

### Voting Rules:
- **4-vote acceptance threshold** required for proposal approval
- **Mandatory written reviews** for each vote (riskAssessment, revenueComment)
- **One vote per officer per proposal**
- **Automatic status transitions** based on vote count

### Proposal Lifecycle:
1. **DRAFT** → Organizer editing (not visible to officers)
2. **SUBMITTED** → Available for officer review
3. **UNDER_REVIEW** → Officers are reviewing and voting
4. **ACCEPTED** → Received 4+ accept votes
5. **REJECTED** → Failed to meet acceptance threshold

### Voting Process:
1. Officer views proposal (triggers UNDER_REVIEW status)
2. Officer submits vote with mandatory review
3. System checks vote count in real-time
4. Automatic status change when threshold met
5. Admin can override any decision

---

## 🔧 **TESTING WORKFLOW**

### 1. **Setup Test Environment**
```bash
# Set base URL
BASE_URL="https://crawdwall-backend-ywlk.onrender.com"

# Test health check
curl $BASE_URL/health
```

### 2. **Test User Registration & Authentication**
```bash
# Register organizer
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Organizer",
    "email": "test.organizer@example.com",
    "phoneNumber": "+1234567890", 
    "password": "TestPass123",
    "role": "ORGANIZER"
  }'

# Login and get token
curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.organizer@example.com",
    "password": "TestPass123"
  }'
```

### 3. **Test Proposal Creation**
```bash
# Create proposal (use token from login)
curl -X POST $BASE_URL/api/organizer/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "eventTitle": "Test Conference 2024",
    "description": "A test conference for API validation",
    "expectedRevenue": 100000,
    "timeline": "6 months"
  }'
```

### 4. **Test Admin System**
```bash
# Request admin OTP
curl -X POST $BASE_URL/api/admin/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "thiscrawdwallcapital@gmail.com"
  }'
```

---

## 📞 **SUPPORT & CONTACT**

- **Admin Email**: thiscrawdwallcapital@gmail.com
- **API Version**: 5.0.0
- **Last Updated**: January 20, 2026
- **Environment**: Production

---

## 🚨 **IMPORTANT NOTES**

1. **Rate Limiting**: API may have rate limits on production
2. **CORS**: Configured for web applications
3. **SSL**: All endpoints use HTTPS
4. **Authentication**: JWT tokens expire after 7 days
5. **File Uploads**: Maximum file size limits apply
6. **Database**: PostgreSQL with SSL connections

---

## 🎉 **READY FOR FRONTEND INTEGRATION**

This API is fully tested and production-ready. All endpoints are functional and follow RESTful conventions. The PRD voting system is fully implemented with automatic status transitions and admin override capabilities.

**Frontend developers can now integrate with confidence!** 🚀