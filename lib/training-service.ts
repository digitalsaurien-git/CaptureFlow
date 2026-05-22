import { TrainingItemStatus, TrainingStatus, type Prisma, type ProgressStep } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateTrainingInput,
  CreateTrainingItemInput,
  ReorderTrainingItemsInput,
  UpdateTrainingInput,
  UpdateTrainingItemInput
} from "@/lib/training-validations";

const progressValues: Record<ProgressStep, number> = {
  P0: 0,
  P20: 20,
  P40: 40,
  P60: 60,
  P80: 80,
  P100: 100
};

const trainingDetailInclude = {
  items: {
    where: { status: TrainingItemStatus.ACTIVE },
    orderBy: { position: "asc" as const },
    include: {
      notes: {
        orderBy: { createdAt: "desc" as const }
      }
    }
  },
  notes: {
    orderBy: { createdAt: "desc" as const }
  }
} satisfies Prisma.TrainingInclude;

type TrainingWithItems = Prisma.TrainingGetPayload<{
  include: typeof trainingDetailInclude;
}>;

function withTrainingMetrics(training: TrainingWithItems) {
  const totalDurationMinutes = training.items.reduce(
    (total, item) => total + item.durationMinutes,
    0
  );

  const progressPercent =
    training.items.length === 0
      ? 0
      : Math.round(
          training.items.reduce((total, item) => total + progressValues[item.progress], 0) /
            training.items.length
        );

  return {
    ...training,
    totalDurationMinutes,
    progressPercent
  };
}

function normalizeTrainingItemInput(
  input: CreateTrainingItemInput | UpdateTrainingItemInput
) {
  return {
    ...input,
    progress: input.progress ?? (input.isDone === true ? "P100" : undefined),
    isDone: input.isDone ?? (input.progress === "P100" ? true : undefined)
  };
}

export async function listTrainings() {
  return prisma.training.findMany({
    where: { status: TrainingStatus.ACTIVE },
    orderBy: { updatedAt: "desc" }
  });
}

export async function createTraining(input: CreateTrainingInput) {
  return prisma.training.create({
    data: {
      title: input.title,
      description: input.description || null,
      status: TrainingStatus.ACTIVE
    }
  });
}

export async function getTraining(id: string) {
  const training = await prisma.training.findFirst({
    where: { id, status: TrainingStatus.ACTIVE },
    include: trainingDetailInclude
  });

  return training ? withTrainingMetrics(training) : null;
}

export async function updateTraining(id: string, input: UpdateTrainingInput) {
  const training = await prisma.training.findFirst({
    where: { id, status: TrainingStatus.ACTIVE },
    select: { id: true }
  });

  if (!training) {
    return null;
  }

  return prisma.training.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description === undefined ? undefined : input.description || null
    }
  });
}

export async function archiveTraining(id: string) {
  const training = await prisma.training.findFirst({
    where: { id, status: TrainingStatus.ACTIVE },
    select: { id: true }
  });

  if (!training) {
    return null;
  }

  return prisma.training.update({
    where: { id },
    data: { status: TrainingStatus.ARCHIVED }
  });
}

export async function createTrainingItem(
  trainingId: string,
  input: CreateTrainingItemInput
) {
  const training = await prisma.training.findFirst({
    where: { id: trainingId, status: TrainingStatus.ACTIVE },
    select: { id: true }
  });

  if (!training) {
    return null;
  }

  const maxPositionItem = await prisma.trainingItem.findFirst({
    where: { trainingId, status: TrainingItemStatus.ACTIVE },
    orderBy: { position: "desc" },
    select: { position: true }
  });

  const normalized = normalizeTrainingItemInput(input);

  return prisma.trainingItem.create({
    data: {
      trainingId,
      title: input.title,
      durationMinutes: input.durationMinutes,
      progress: normalized.progress ?? "P0",
      isDone: normalized.isDone ?? false,
      status: TrainingItemStatus.ACTIVE,
      position: (maxPositionItem?.position ?? -1) + 1
    }
  });
}

export async function updateTrainingItem(id: string, input: UpdateTrainingItemInput) {
  const item = await prisma.trainingItem.findFirst({
    where: { id, status: TrainingItemStatus.ACTIVE },
    select: { id: true }
  });

  if (!item) {
    return null;
  }

  const normalized = normalizeTrainingItemInput(input);

  return prisma.trainingItem.update({
    where: { id },
    data: {
      title: input.title,
      durationMinutes: input.durationMinutes,
      progress: normalized.progress,
      isDone: normalized.isDone
    }
  });
}

export async function archiveTrainingItem(id: string) {
  const item = await prisma.trainingItem.findFirst({
    where: { id, status: TrainingItemStatus.ACTIVE },
    select: { id: true }
  });

  if (!item) {
    return null;
  }

  return prisma.trainingItem.update({
    where: { id },
    data: { status: TrainingItemStatus.ARCHIVED }
  });
}

export async function reorderTrainingItems(
  trainingId: string,
  input: ReorderTrainingItemsInput
) {
  const training = await prisma.training.findFirst({
    where: { id: trainingId, status: TrainingStatus.ACTIVE },
    select: { id: true }
  });

  if (!training) {
    return null;
  }

  const items = await prisma.trainingItem.findMany({
    where: {
      id: { in: input.itemIds },
      trainingId,
      status: TrainingItemStatus.ACTIVE
    },
    select: { id: true }
  });

  if (items.length !== input.itemIds.length) {
    return null;
  }

  return prisma.$transaction(
    input.itemIds.map((itemId, position) =>
      prisma.trainingItem.update({
        where: { id: itemId },
        data: { position }
      })
    )
  );
}
