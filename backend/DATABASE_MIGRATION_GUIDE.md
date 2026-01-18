# 🗄️ Database Migration Guide - Admin/Officer System

## ⚠️ Important: Breaking Changes

This update introduces significant database schema changes. **Backup your database before proceeding.**

---

## 🎯 What's Changing

### Schema Changes
1. **New Officer Table** - Replaces Admin table functionality
2. **Updated Role Enum** - ADMIN removed, OFFICER added
3. **New OfficerStatus Enum** - ACTIVE, INACTIVE, SUSPENDED
4. **Updated Foreign Keys** - Review table now references Officer

### Authentication Changes
1. **Admin Authentication** - Now uses OTP only
2. **Officer Authentication** - Email/password login
3. **Role Structure** - Clear hierarchy: Admin → Officers → Users

---

## 🔄 Migration Steps

### Step 1: Backup Current Database
```sql
-- Create backup
pg_dump your_database > crawdwall_backup_$(date +%Y%m%d).sql
```

### Step 2: Run Migration Script
```bash
# Use the new schema file
node run-migrations.js
```

### Step 3: Data Migration (if needed)
If you have existing admin users, migrate them to officers:

```sql
-- Example: Migrate existing admin users to officers
INSERT INTO "Officer" (id, email, name, password, status, "createdBy", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  email,
  name,
  'temp_password_hash', -- You'll need to set proper passwords
  'ACTIVE',
  'thiscrawdwallcapital@gmail.com',
  NOW(),
  NOW()
FROM "Admin" 
WHERE status = 'ACTIVE';
```

---

## 📋 New Database Schema

### Officer Table
```sql
CREATE TABLE "Officer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" "OfficerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);
```

### Updated Enums
```sql
-- Updated Role enum (ADMIN removed from User table)
CREATE TYPE "Role" AS ENUM ('ORGANIZER', 'INVESTOR', 'OFFICER');

-- New Officer Status enum
CREATE TYPE "OfficerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
```

### Updated Constraints
```sql
-- Review table now references Officer instead of Admin
ALTER TABLE "Review" 
DROP CONSTRAINT IF EXISTS "Review_reviewerId_fkey";

ALTER TABLE "Review" 
ADD CONSTRAINT "Review_reviewerId_fkey" 
FOREIGN KEY ("reviewerId") REFERENCES "Officer"("id");
```

---

## 🔧 Environment Variables Update

### Old Variables (Remove)
```env
SUPER_ADMIN_EMAIL=thiscrawdwallcapital@gmail.com
```

### New Variables (Add)
```env
ADMIN_EMAIL=thiscrawdwallcapital@gmail.com
```

---

## 🧪 Testing Migration

### 1. Test Admin Login
```bash
# Request OTP
curl -X POST http://localhost:3000/admin/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "thiscrawdwallcapital@gmail.com"}'

# Verify OTP (check email)
curl -X POST http://localhost:3000/admin/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "thiscrawdwallcapital@gmail.com", "otp": "123456"}'
```

### 2. Test Officer Creation
```bash
# Create officer (use admin token from step 1)
curl -X POST http://localhost:3000/admin/officers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "email": "officer@test.com",
    "name": "Test Officer",
    "password": "TestPass123!"
  }'
```

### 3. Test Officer Login
```bash
# Officer login
curl -X POST http://localhost:3000/officer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "officer@test.com",
    "password": "TestPass123!"
  }'
```

---

## 🚨 Troubleshooting

### Migration Fails
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('Officer', 'User', 'Proposal');

-- Check enum types
SELECT typname FROM pg_type WHERE typname IN ('Role', 'OfficerStatus');
```

### Foreign Key Issues
```sql
-- Check existing reviews
SELECT COUNT(*) FROM "Review";

-- Check if reviewerId references exist
SELECT r.id, r."reviewerId" 
FROM "Review" r 
LEFT JOIN "Officer" o ON r."reviewerId" = o.id 
WHERE o.id IS NULL;
```

### Role Issues
```sql
-- Check user roles
SELECT role, COUNT(*) FROM "User" GROUP BY role;

-- Update any invalid roles
UPDATE "User" SET role = 'ORGANIZER' WHERE role = 'ADMIN';
```

---

## 📊 Verification Queries

### Check Migration Success
```sql
-- Verify Officer table
SELECT COUNT(*) as officer_count FROM "Officer";

-- Verify Role enum
SELECT unnest(enum_range(NULL::Role)) as roles;

-- Verify OfficerStatus enum
SELECT unnest(enum_range(NULL::OfficerStatus)) as statuses;

-- Check foreign key constraints
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'Review';
```

---

## 🔄 Rollback Plan

If migration fails, restore from backup:

```bash
# Stop application
# Restore database
psql your_database < crawdwall_backup_YYYYMMDD.sql

# Restart application with old code
git checkout previous_commit
npm start
```

---

## 📋 Post-Migration Checklist

- [ ] Officer table created successfully
- [ ] Role enum updated (no ADMIN in User table)
- [ ] OfficerStatus enum created
- [ ] Foreign key constraints updated
- [ ] Admin OTP login works
- [ ] Officer creation works
- [ ] Officer login works
- [ ] Proposal review works
- [ ] All existing users still work
- [ ] All existing proposals preserved

---

## 🎯 Next Steps

1. **Update API clients** to use new endpoints
2. **Import new Postman collection** (v2)
3. **Create initial officers** via admin panel
4. **Test complete workflow** end-to-end
5. **Update documentation** and guides

---

## 📞 Support

If you encounter issues:

1. **Check logs** for specific error messages
2. **Verify database** schema matches expected structure
3. **Test endpoints** individually with Postman
4. **Restore backup** if critical issues occur

**The migration introduces a cleaner, more secure admin system with proper role separation.**