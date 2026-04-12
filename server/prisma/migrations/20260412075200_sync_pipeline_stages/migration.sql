/*
  Warnings:

  - The values [QUALIFIED,PROPOSAL] on the enum `Stage` will be removed. If these variants are still used in the database, this will fail.

*/

-- Pre-migration safety check: Ensure no legacy 'Stage' values exist that aren't in 'Stage_new'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "Lead" 
        WHERE "stage"::text NOT IN ('NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST')
    ) THEN
        RAISE EXCEPTION 'Migration failed: Legacy stage values (like QUALIFIED or PROPOSAL) found in Lead table. Please run server/scripts/map-stages.js first to map these to the new Stage_new enum.';
    END IF;
END $$;

-- AlterEnum
BEGIN;
CREATE TYPE "Stage_new" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST');
ALTER TABLE "Lead" ALTER COLUMN "stage" TYPE "Stage_new" USING ("stage"::text::"Stage_new");
ALTER TYPE "Stage" RENAME TO "Stage_old";
ALTER TYPE "Stage_new" RENAME TO "Stage";
DROP TYPE "Stage_old";
COMMIT;
