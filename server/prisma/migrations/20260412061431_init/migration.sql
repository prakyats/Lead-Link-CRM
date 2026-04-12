/*
  Warnings:

  - The `status` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InteractionType" ADD VALUE 'WHATSAPP';
ALTER TYPE "InteractionType" ADD VALUE 'OTHER';

-- DropIndex
DROP INDEX "Task_assignedToId_status_idx";

-- AlterTable
ALTER TABLE "Interaction" ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "interactionId" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Task_assignedToId_dueDate_status_idx" ON "Task"("assignedToId", "dueDate", "status");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
