-- CreateEnum
CREATE TYPE "invoicing"."DocumentKind" AS ENUM ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'SUPPORT_DOCUMENT', 'SUPPORT_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "invoicing"."AliaddoMode" AS ENUM ('TEST', 'HABILITATION', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "invoicing"."DocumentStatus" AS ENUM ('CREATED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "invoicing"."DocumentFileType" AS ENUM ('PDF', 'XML', 'XML_ZIP', 'APPLICATION_RESPONSE', 'ATTACHED_DOCUMENT');

-- CreateTable
CREATE TABLE "invoicing"."InvoicingDocument" (
    "id" TEXT NOT NULL,
    "issuerType" "invoicing"."IssuerType" NOT NULL,
    "issuerId" TEXT NOT NULL,
    "authUserId" TEXT,
    "kind" "invoicing"."DocumentKind" NOT NULL,
    "mode" "invoicing"."AliaddoMode" NOT NULL,
    "status" "invoicing"."DocumentStatus" NOT NULL DEFAULT 'CREATED',
    "requestPayload" JSONB NOT NULL,
    "aliaddoId" TEXT,
    "cufe" TEXT,
    "cuds" TEXT,
    "dianDeliveryStatus" TEXT,
    "dianState" TEXT,
    "dianStateReason" JSONB,
    "urlPdf" TEXT,
    "urlXmlDocument" TEXT,
    "urlXmlDocumentZip" TEXT,
    "urlXmlApplicationResponse" TEXT,
    "urlXmlAttachedDocument" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoicingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoicing"."InvoicingDocumentAttempt" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "mode" "invoicing"."AliaddoMode" NOT NULL,
    "authUserId" TEXT,
    "requestPayload" JSONB NOT NULL,
    "responseStatusCode" INTEGER,
    "responseBody" JSONB,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicingDocumentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoicing"."InvoicingDocumentFile" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "type" "invoicing"."DocumentFileType" NOT NULL,
    "attemptNumber" INTEGER,
    "sourceUrl" TEXT,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT,
    "sizeBytes" INTEGER,
    "sha256" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicingDocumentFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoicingDocument_issuerType_issuerId_kind_idx" ON "invoicing"."InvoicingDocument"("issuerType", "issuerId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "InvoicingDocumentAttempt_documentId_number_key" ON "invoicing"."InvoicingDocumentAttempt"("documentId", "number");

-- CreateIndex
CREATE INDEX "InvoicingDocumentAttempt_documentId_idx" ON "invoicing"."InvoicingDocumentAttempt"("documentId");

-- CreateIndex
CREATE INDEX "InvoicingDocumentFile_documentId_type_idx" ON "invoicing"."InvoicingDocumentFile"("documentId", "type");

-- AddForeignKey
ALTER TABLE "invoicing"."InvoicingDocumentAttempt" ADD CONSTRAINT "InvoicingDocumentAttempt_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "invoicing"."InvoicingDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoicing"."InvoicingDocumentFile" ADD CONSTRAINT "InvoicingDocumentFile_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "invoicing"."InvoicingDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
