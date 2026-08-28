ALTER TABLE "transaction" ADD COLUMN "import_fingerprint" TEXT;

CREATE UNIQUE INDEX "transaction_import_fingerprint_key" ON "transaction"("import_fingerprint");
