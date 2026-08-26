ALTER TABLE "financial_account" ADD COLUMN "currency_code" TEXT NOT NULL DEFAULT 'BRL';

ALTER TABLE "transaction" ADD COLUMN "bank_account_id" TEXT;
ALTER TABLE "transaction" ADD COLUMN "external_transaction_id" TEXT;
ALTER TABLE "transaction" ADD COLUMN "merchant_name" TEXT;
ALTER TABLE "transaction" ADD COLUMN "raw_data" JSONB;

CREATE TABLE "bank_connection" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "financial_space_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "external_item_id" TEXT NOT NULL,
  "connector_name" TEXT NOT NULL,
  "connector_logo_url" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "last_synced_at" TIMESTAMP(3),
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bank_connection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bank_account" (
  "id" TEXT NOT NULL,
  "connection_id" TEXT NOT NULL,
  "financial_account_id" TEXT,
  "external_account_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "subtype" TEXT,
  "masked_number" TEXT,
  "currency_code" TEXT NOT NULL DEFAULT 'BRL',
  "current_balance_cents" INTEGER,
  "available_balance_cents" INTEGER,
  "source" TEXT NOT NULL DEFAULT 'OPEN_FINANCE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bank_account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bank_connection_provider_external_item_id_key" ON "bank_connection"("provider", "external_item_id");
CREATE INDEX "bank_connection_user_id_financial_space_id_idx" ON "bank_connection"("user_id", "financial_space_id");
CREATE UNIQUE INDEX "bank_account_connection_id_external_account_id_key" ON "bank_account"("connection_id", "external_account_id");
CREATE INDEX "bank_account_financial_account_id_idx" ON "bank_account"("financial_account_id");
CREATE UNIQUE INDEX "transaction_external_unique" ON "transaction"("bank_account_id", "external_transaction_id");

ALTER TABLE "bank_connection" ADD CONSTRAINT "bank_connection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bank_connection" ADD CONSTRAINT "bank_connection_financial_space_id_fkey" FOREIGN KEY ("financial_space_id") REFERENCES "financial_space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "bank_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_financial_account_id_fkey" FOREIGN KEY ("financial_account_id") REFERENCES "financial_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
