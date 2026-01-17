-- Create ENUM types
CREATE TYPE "Role" AS ENUM ('ORGANIZER', 'INVESTOR', 'ADMIN');
CREATE TYPE "AdminStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "ProposalStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'FUNDED');
CREATE TYPE "VoteType" AS ENUM ('ACCEPT', 'REJECT');
CREATE TYPE "InterestStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'WITHDRAWN');

-- Create User table
CREATE TABLE "User" (
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

-- Create Admin table
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" "AdminStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- Create Proposal table
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expectedRevenue" DOUBLE PRECISION NOT NULL,
    "timeline" TEXT NOT NULL,
    "eventType" TEXT,
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
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposalId" TEXT NOT NULL,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- Create Review table
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "riskAssessment" TEXT NOT NULL,
    "revenueComment" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- Create InvestorInterest table
CREATE TABLE "InvestorInterest" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "interestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "InterestStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "InvestorInterest_pkey" PRIMARY KEY ("id")
);

-- Create OTP table
CREATE TABLE "OTP" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
CREATE UNIQUE INDEX "InvestorInterest_investorId_proposalId_key" ON "InvestorInterest"("investorId", "proposalId");

-- Create indexes
CREATE INDEX "Review_proposalId_idx" ON "Review"("proposalId");
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");
CREATE INDEX "InvestorInterest_investorId_idx" ON "InvestorInterest"("investorId");
CREATE INDEX "InvestorInterest_proposalId_idx" ON "InvestorInterest"("proposalId");
CREATE INDEX "OTP_email_idx" ON "OTP"("email");

-- Add foreign key constraints
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvestorInterest" ADD CONSTRAINT "InvestorInterest_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvestorInterest" ADD CONSTRAINT "InvestorInterest_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
