/*
  Warnings:

  - The `status` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus" USING ("status"::text::"TaskStatus");
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Task_assignedToId_dueDate_status_idx" ON "Task"("assignedToId", "dueDate", "status");
