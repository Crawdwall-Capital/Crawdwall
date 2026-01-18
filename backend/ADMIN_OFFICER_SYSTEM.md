# 🏛️ Admin & Officer System - Complete Guide

## 🎯 New Hierarchy Structure

### 👑 ADMIN (Platform Manager)
- **Email**: `thiscrawdwallcapital@gmail.com`
- **Authentication**: OTP-based login
- **Responsibilities**:
  - Overall platform oversight
  - Create and manage officers
  - Suspend/activate officers
  - View platform statistics
  - Full system access

### 👮 OFFICER (Review Staff)
- **Authentication**: Email/Password login
- **Created by**: Admin
- **Responsibilities**:
  - Review submitted proposals
  - Vote on proposals (ACCEPT/REJECT)
  - View proposal details
  - Track review history

### 👥 Users (Unchanged)
- **ORGANIZER**: Create and manage proposals
- **INVESTOR**: View approved investment opportunities

---

## 🔐 Authentication Flows

### Admin Login (OTP-based)
```
1. POST /admin/request-otp
   Body: { "email": "thiscrawdwallcapital@gmail.com" }
   
2. Check email for OTP code

3. POST /admin/verify-otp
   Body: { "email": "thiscrawdwallcapital@gmail.com", "otp": "123456" }
   
4. Receive JWT token with role: "ADMIN"
```

### Officer Login (Email/Password)
```
1. POST /officer/login
   Body: { "email": "officer@example.com", "password": "password123" }
   
2. Receive JWT token with role: "OFFICER"
```

---

## 📋 API Endpoints

### Admin Endpoints

#### Authentication
- `POST /admin/request-otp` - Request OTP for admin login
- `POST /admin/verify-otp` - Verify OTP and get token

#### Officer Management
- `POST /admin/officers` - Create new officer
- `GET /admin/officers` - List all officers
- `PUT /admin/officers/:id/status` - Update officer status
- `DELETE /admin/officers/:id` - Delete officer

#### Platform Management
- `GET /admin/stats` - Get platform statistics

### Officer Endpoints

#### Authentication
- `POST /officer/login` - Officer login with email/password
- `GET /officer/profile` - Get officer profile

#### Proposal Review
- `GET /officer/proposals` - Get submitted proposals for review
- `GET /officer/proposals/:id` - Get proposal details
- `POST /officer/proposals/:id/vote` - Vote on proposal
- `GET /officer/reviews` - Get officer's review history

---

## 🗄️ Database Schema Changes

### New Officer Table
```sql
CREATE TABLE "Officer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" "OfficerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL, -- Admin email
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);
```

### Updated Enums
```sql
-- Updated Role enum
CREATE TYPE "Role" AS ENUM ('ORGANIZER', 'INVESTOR', 'OFFICER');

-- New Officer Status enum
CREATE TYPE "OfficerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
```

### Updated Review Table
```sql
-- Review table now references Officer instead of Admin
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" 
FOREIGN KEY ("reviewerId") REFERENCES "Officer"("id");
```

---

## 🔧 Usage Examples

### 1. Admin Creates Officer

```bash
# 1. Admin login
curl -X POST http://localhost:3000/admin/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "thiscrawdwallcapital@gmail.com"}'

# 2. Verify OTP (check email)
curl -X POST http://localhost:3000/admin/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "thiscrawdwallcapital@gmail.com", "otp": "123456"}'

# 3. Create officer
curl -X POST http://localhost:3000/admin/officers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "email": "officer1@crawdwall.com",
    "name": "John Officer",
    "password": "SecurePass123!"
  }'
```

### 2. Officer Reviews Proposal

```bash
# 1. Officer login
curl -X POST http://localhost:3000/officer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "officer1@crawdwall.com",
    "password": "SecurePass123!"
  }'

# 2. Get proposals to review
curl -X GET http://localhost:3000/officer/proposals \
  -H "Authorization: Bearer OFFICER_TOKEN"

# 3. Vote on proposal
curl -X POST http://localhost:3000/officer/proposals/PROPOSAL_ID/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer OFFICER_TOKEN" \
  -d '{
    "vote": "ACCEPT",
    "riskAssessment": "Low risk - well planned event",
    "revenueComment": "Revenue projections are realistic",
    "notes": "Recommend approval"
  }'
```

### 3. Admin Manages Officers

```bash
# Get all officers
curl -X GET http://localhost:3000/admin/officers \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Suspend an officer
curl -X PUT http://localhost:3000/admin/officers/OFFICER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"status": "SUSPENDED"}'

# Get platform statistics
curl -X GET http://localhost:3000/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🔄 Migration from Old System

### What Changed
1. **Super Admin** → **Admin** (OTP login only)
2. **Admin** → **Officer** (email/password login)
3. **Admin table** → **Officer table**
4. **Role enum** updated
5. **Review foreign keys** updated

### Migration Steps
1. ✅ New database schema created
2. ✅ New authentication flows implemented
3. ✅ New API endpoints created
4. ✅ Role-based access updated
5. ✅ Documentation updated

---

## 🛡️ Security Features

### Admin Security
- ✅ **OTP Authentication** - Time-limited codes
- ✅ **Single Admin Email** - Only `thiscrawdwallcapital@gmail.com`
- ✅ **Email Verification** - OTP sent to verified email
- ✅ **Token Expiry** - 7-day JWT tokens

### Officer Security
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Status Control** - Admin can suspend officers
- ✅ **Role Verification** - JWT-based role checking
- ✅ **Audit Trail** - Track who created officers

### General Security
- ✅ **JWT Tokens** - Secure authentication
- ✅ **Role-based Access** - Endpoint protection
- ✅ **Input Validation** - Request validation
- ✅ **SQL Injection Protection** - Parameterized queries

---

## 📊 Officer Status Management

### Status Types
- **ACTIVE** - Can login and review proposals
- **INACTIVE** - Cannot login (temporary)
- **SUSPENDED** - Cannot login (disciplinary)

### Admin Controls
```bash
# Activate officer
PUT /admin/officers/:id/status
{"status": "ACTIVE"}

# Suspend officer
PUT /admin/officers/:id/status
{"status": "SUSPENDED"}

# Deactivate officer
PUT /admin/officers/:id/status
{"status": "INACTIVE"}
```

---

## 🎯 Workflow Examples

### Complete Proposal Review Workflow

1. **Organizer** submits proposal → Status: `SUBMITTED`
2. **Officer** views proposal → Status: `IN_REVIEW`
3. **Officer** votes on proposal → Status: `APPROVED` or `REJECTED`
4. **Investor** sees approved proposals
5. **Admin** monitors all activity

### Officer Management Workflow

1. **Admin** logs in with OTP
2. **Admin** creates officer with email/password
3. **Officer** logs in with credentials
4. **Officer** reviews proposals
5. **Admin** can suspend officer if needed

---

## 🔍 Monitoring & Analytics

### Platform Statistics (Admin View)
```json
{
  "organizers": 150,
  "investors": 300,
  "officers": 5,
  "total_proposals": 45,
  "pending_proposals": 12,
  "approved_proposals": 28,
  "total_reviews": 67
}
```

### Officer Performance Tracking
- Review count per officer
- Vote distribution (Accept/Reject)
- Response time metrics
- Activity logs

---

## 🚨 Important Notes

### Breaking Changes
⚠️ **This is a breaking change** - old admin endpoints will not work

### Migration Required
- Database schema must be updated
- Existing admin users need to be migrated to officers
- API clients need endpoint updates

### Backward Compatibility
- User roles (ORGANIZER, INVESTOR) unchanged
- Proposal system unchanged
- Investment system unchanged

---

## 📞 Support & Troubleshooting

### Common Issues

#### Admin Can't Login
- Verify email is exactly: `thiscrawdwallcapital@gmail.com`
- Check OTP hasn't expired (10 minutes)
- Ensure email service is configured

#### Officer Can't Login
- Verify officer status is `ACTIVE`
- Check email/password combination
- Confirm officer was created by admin

#### Permission Denied
- Verify JWT token is valid
- Check user role matches endpoint requirements
- Ensure officer hasn't been suspended

### Debug Commands
```bash
# Check officer status
GET /officer/profile

# Check admin permissions
GET /admin/stats

# View officer list (admin only)
GET /admin/officers
```

---

## 🎉 Summary

The new Admin/Officer system provides:

✅ **Clear Hierarchy** - Admin manages officers, officers review proposals  
✅ **Secure Authentication** - OTP for admin, password for officers  
✅ **Granular Control** - Admin can create/suspend officers  
✅ **Audit Trail** - Track who does what  
✅ **Scalable Design** - Easy to add more officers  
✅ **Role Separation** - Clear responsibilities  

**The system is now ready for production use with proper access controls and security measures.**