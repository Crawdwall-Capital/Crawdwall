-- Create ENUM types for new structure
CREATE TYPE "Role" AS ENUM ('ORGANIZER', 'INVESTOR', 'OFFICER');
CREATE TYPE "OfficerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "ProposalStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'FUNDED');
CREATE TYPE "VoteType" AS ENUM ('ACCEPT', 'REJECT');
CREATE TYPE "InterestStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'WITHDRAWN');

-- Create User table (ORGANIZER, INVESTOR, OFFICER)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create Officer table (replaces Admin table)
CREATE TABLE IF NOT EXISTS "Officer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" "OfficerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL, -- Admin who created this officer
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);

-- Create Proposal table
CREATE TABLE IF NOT EXISTS "Proposal" (
    "id" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expectedRevenue" INTEGER NOT NULL,
    "timeline" TEXT NOT NULL,
    "pitchVideoUrl" TEXT,
    "budgetFile" TEXT,
    "revenuePlanFile" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'SUBMITTED',
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- Create StatusHistory table
CREATE TABLE IF NOT EXISTS "StatusHistory" (
    "id" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL,
    "proposalId" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- Create Review table (now for Officers instead of Admins)
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL, -- Officer ID
    "vote" "VoteType" NOT NULL,
    "riskAssessment" TEXT,
    "revenueComment" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- Create InvestorInterest table
CREATE TABLE IF NOT EXISTS "InvestorInterest" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "status" "InterestStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorInterest_pkey" PRIMARY KEY ("id")
);

-- Create OTP table (for Admin login only)
CREATE TABLE IF NOT EXISTS "OTP" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Officer_email_key" ON "Officer"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "InvestorInterest_investorId_proposalId_key" ON "InvestorInterest"("investorId", "proposalId");

-- Create indexes
CREATE INDEX IF NOT EXISTS "Review_proposalId_idx" ON "Review"("proposalId");
CREATE INDEX IF NOT EXISTS "Review_reviewerId_idx" ON "Review"("reviewerId");
CREATE INDEX IF NOT EXISTS "InvestorInterest_investorId_idx" ON "InvestorInterest"("investorId");
CREATE INDEX IF NOT EXISTS "InvestorInterest_proposalId_idx" ON "InvestorInterest"("proposalId");
CREATE INDEX IF NOT EXISTS "OTP_email_idx" ON "OTP"("email");

-- Add foreign key constraints
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Officer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvestorInterest" ADD CONSTRAINT "InvestorInterest_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvestorInterest" ADD CONSTRAINT "InvestorInterest_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;