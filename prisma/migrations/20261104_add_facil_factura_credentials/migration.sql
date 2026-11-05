-- Encrypted Facil Factura credentials per issuer (doctor or clinic).
ALTER TABLE "invoicing"."IssuerIntegration"
ADD COLUMN "facilFacturaApiKeyEnc" TEXT,
ADD COLUMN "facilFacturaApiKeyIv" TEXT,
ADD COLUMN "facilFacturaApiKeyTag" TEXT,
ADD COLUMN "facilFacturaApiSecretEnc" TEXT,
ADD COLUMN "facilFacturaApiSecretIv" TEXT,
ADD COLUMN "facilFacturaApiSecretTag" TEXT;
