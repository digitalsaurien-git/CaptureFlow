-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CaptureStatus" AS ENUM ('INBOX', 'TODO', 'DONE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Capture" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "source" TEXT,
    "status" "CaptureStatus" NOT NULL DEFAULT 'INBOX',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Capture_status_idx" ON "Capture"("status");

-- CreateIndex
CREATE INDEX "Capture_createdAt_idx" ON "Capture"("createdAt");
