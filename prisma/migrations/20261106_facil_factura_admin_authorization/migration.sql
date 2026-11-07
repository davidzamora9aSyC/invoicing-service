-- Facil Factura activation is requested by the issuer and authorized by MeuDoc admin.
ALTER TABLE "invoicing"."IssuerIntegration"
ADD COLUMN IF NOT EXISTS "facilFacturaScope" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaRequestedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "facilFacturaActiveEnvironment" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaTestKeyHint" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaProdKeyHint" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaTestApiKeyEnc" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaTestApiKeyIv" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaTestApiKeyTag" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaTestApiSecretEnc" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaTestApiSecretIv" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaTestApiSecretTag" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaProdApiKeyEnc" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaProdApiKeyIv" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaProdApiKeyTag" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaProdApiSecretEnc" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaProdApiSecretIv" TEXT,
ADD COLUMN IF NOT EXISTS "facilFacturaProdApiSecretTag" TEXT;
