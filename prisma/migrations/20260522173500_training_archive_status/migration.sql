-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TrainingItemStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Training" ADD COLUMN "status" "TrainingStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "TrainingItem" ADD COLUMN "status" "TrainingItemStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Training_status_idx" ON "Training"("status");

-- CreateIndex
CREATE INDEX "TrainingItem_status_idx" ON "TrainingItem"("status");
