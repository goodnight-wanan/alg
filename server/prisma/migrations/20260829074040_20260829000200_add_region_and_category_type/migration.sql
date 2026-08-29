-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('GENRE', 'MOOD', 'ERA', 'REGION', 'CHART', 'FEATURE');

-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "region" VARCHAR(60);

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "type" "CategoryType";

-- Backfill category types from the slug prefixes used by the existing catalog.
UPDATE "categories"
SET "type" = CASE
  WHEN "slug" LIKE 'genre-%' THEN 'GENRE'::"CategoryType"
  WHEN "slug" LIKE 'mood-%' THEN 'MOOD'::"CategoryType"
  WHEN "slug" LIKE 'era-%' THEN 'ERA'::"CategoryType"
  WHEN "slug" LIKE 'region-%' THEN 'REGION'::"CategoryType"
  WHEN "slug" LIKE 'chart-%' THEN 'CHART'::"CategoryType"
  WHEN "slug" LIKE 'feature-%' THEN 'FEATURE'::"CategoryType"
  ELSE "type"
END;
