-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "invoicing";

-- CreateEnum
CREATE TYPE "invoicing"."IssuerType" AS ENUM ('DOCTOR', 'CLINIC');

-- CreateEnum
CREATE TYPE "invoicing"."IntegrationStatus" AS ENUM ('NOT_CONFIGURED', 'PENDING_DIAN', 'IN_HABILITATION', 'ENABLED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "invoicing"."IssuerIntegration" (
    "id" TEXT NOT NULL,
    "issuerType" "invoicing"."IssuerType" NOT NULL,
    "issuerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'ALIADDO',
    "status" "invoicing"."IntegrationStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "dianTestSetId" TEXT,
    "apiKeyHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssuerIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IssuerIntegration_issuerType_issuerId_key" ON "invoicing"."IssuerIntegration"("issuerType", "issuerId");

-- CreateIndex
CREATE INDEX "IssuerIntegration_issuerType_issuerId_idx" ON "invoicing"."IssuerIntegration"("issuerType", "issuerId");

