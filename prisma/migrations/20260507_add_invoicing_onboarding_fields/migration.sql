ALTER TABLE "invoicing"."IssuerIntegration"
ADD COLUMN "onboardingData" JSONB,
ADD COLUMN "onboardingSubmittedAt" TIMESTAMP(3),
ADD COLUMN "onboardingReviewedAt" TIMESTAMP(3),
ADD COLUMN "onboardingReviewedByAuthUserId" TEXT,
ADD COLUMN "onboardingReviewNotes" TEXT;

