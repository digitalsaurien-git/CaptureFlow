import { PriorityCloudItemStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreatePriorityCloudItemInput,
  UpdatePriorityCloudItemInput
} from "@/lib/priority-cloud-validations";

export async function listPriorityCloudItems() {
  return prisma.priorityCloudItem.findMany({
    where: { status: PriorityCloudItemStatus.ACTIVE },
    orderBy: [{ weight: "desc" }, { updatedAt: "desc" }]
  });
}

export async function createPriorityCloudItem(input: CreatePriorityCloudItemInput) {
  return prisma.priorityCloudItem.create({
    data: {
      label: input.label,
      weight: input.weight,
      status: PriorityCloudItemStatus.ACTIVE
    }
  });
}

export async function updatePriorityCloudItem(
  id: string,
  input: UpdatePriorityCloudItemInput
) {
  const item = await prisma.priorityCloudItem.findFirst({
    where: { id, status: PriorityCloudItemStatus.ACTIVE },
    select: { id: true }
  });

  if (!item) {
    return null;
  }

  return prisma.priorityCloudItem.update({
    where: { id },
    data: {
      label: input.label,
      weight: input.weight
    }
  });
}

export async function archivePriorityCloudItem(id: string) {
  const item = await prisma.priorityCloudItem.findFirst({
    where: { id, status: PriorityCloudItemStatus.ACTIVE },
    select: { id: true }
  });

  if (!item) {
    return null;
  }

  return prisma.priorityCloudItem.update({
    where: { id },
    data: { status: PriorityCloudItemStatus.ARCHIVED }
  });
}
