import type { CaptureStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateCaptureInput, UpdateCaptureInput } from "@/lib/validations";

export async function listCaptures(options?: { archived?: boolean }) {
  const archived = options?.archived ?? false;

  return prisma.capture.findMany({
    where: archived
      ? { status: "ARCHIVED" }
      : { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" }
  });
}

export async function createCapture(input: CreateCaptureInput) {
  return prisma.capture.create({
    data: {
      title: input.title,
      content: input.content || null,
      source: input.source || null
    }
  });
}

export async function getCapture(id: string) {
  return prisma.capture.findUnique({
    where: { id }
  });
}

export async function updateCapture(id: string, input: UpdateCaptureInput) {
  return prisma.capture.update({
    where: { id },
    data: {
      ...input,
      content: input.content === undefined ? undefined : input.content || null,
      source: input.source === undefined ? undefined : input.source || null
    }
  });
}

export async function updateCaptureStatus(id: string, status: Exclude<CaptureStatus, "ARCHIVED">) {
  return prisma.capture.update({
    where: { id },
    data: {
      status,
      archivedAt: null
    }
  });
}

export async function archiveCapture(id: string) {
  return prisma.capture.update({
    where: { id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date()
    }
  });
}
