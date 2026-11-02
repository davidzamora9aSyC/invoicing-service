-- Add encrypted provider api key columns (Aliaddo)
ALTER TABLE "invoicing"."IssuerIntegration"
ADD COLUMN "aliaddoApiKeyEnc" TEXT,
ADD COLUMN "aliaddoApiKeyIv" TEXT,
ADD COLUMN "aliaddoApiKeyTag" TEXT;

