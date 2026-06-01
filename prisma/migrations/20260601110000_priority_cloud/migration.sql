-- CreateEnum
CREATE TYPE "PriorityCloudItemStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "PriorityCloudItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 3,
    "status" "PriorityCloudItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityCloudItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriorityCloudItem_status_idx" ON "PriorityCloudItem"("status");

-- CreateIndex
CREATE INDEX "PriorityCloudItem_weight_idx" ON "PriorityCloudItem"("weight");

-- CreateIndex
CREATE INDEX "PriorityCloudItem_createdAt_idx" ON "PriorityCloudItem"("createdAt");
