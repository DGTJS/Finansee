ALTER TABLE "user"
  ADD COLUMN "theme_id" TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN "theme_mode" TEXT NOT NULL DEFAULT 'light';
