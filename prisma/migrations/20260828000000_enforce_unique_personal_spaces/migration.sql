ALTER TABLE "financial_space" ADD COLUMN "personal_key" TEXT;

WITH personal_candidates AS (
  SELECT
    fs."id",
    fs."owner_id",
    ROW_NUMBER() OVER (PARTITION BY fs."owner_id" ORDER BY fs."created_at" ASC, fs."id" ASC) AS "row_number"
  FROM "financial_space" fs
  WHERE EXISTS (
    SELECT 1
    FROM "space_member" sm
    WHERE sm."financial_space_id" = fs."id"
      AND sm."user_id" = fs."owner_id"
      AND sm."status" = 'active'
  )
    AND NOT EXISTS (
      SELECT 1
      FROM "space_member" sm
      WHERE sm."financial_space_id" = fs."id"
        AND sm."user_id" <> fs."owner_id"
        AND sm."status" = 'active'
    )
)
UPDATE "financial_space" fs
SET "personal_key" = personal_candidates."owner_id" || ':personal'
FROM personal_candidates
WHERE fs."id" = personal_candidates."id"
  AND personal_candidates."row_number" = 1;

CREATE UNIQUE INDEX "financial_space_personal_key_key" ON "financial_space"("personal_key");
