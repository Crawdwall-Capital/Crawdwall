-- Refactor Admin/Officer roles
-- Admin becomes the overall platform overseer (OTP login)
-- Officer becomes the review staff (email/password login)

-- Step 1: Create Officer table (rename from Admin table)
CREATE TABLE "officers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "officers_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create unique constraint on email
CREATE UNIQUE INDEX "officers_email_key" ON "officers"("email");

-- Step 3: Migrate existing Admin data to Officer table (if any exists)
INSERT INTO "officers" (id, email, name, password, status, "createdBy", "createdAt", "updatedAt")
SELECT 
    id, 
    email, 
    name,
    'temp_password_' || substr(md5(random()::text), 1, 8) as password, -- Generate temporary password
    status, 
    "createdBy", 
    "createdAt", 
    "updatedAt"
FROM "admins"
WHERE EXISTS (SELECT 1 FROM "admins");

-- Step 4: Update User role from ADMIN to OFFICER (if any exists)
UPDATE "User" SET role = 'OFFICER' WHERE role = 'ADMIN';

-- Step 5: Drop the old admins table
DROP TABLE IF EXISTS "admins";

-- Step 6: Add check constraint for officer status
ALTER TABLE "officers" ADD CONSTRAINT "officers_status_check" 
CHECK ("status" IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'));