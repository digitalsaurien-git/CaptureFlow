import type { Prisma, ProgressStep } from "@prisma/client";
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
    orderBy: { updatedAt: "desc" }
  });
}

export async function createTraining(input: CreateTrainingInput) {
  return prisma.training.create({
    data: {
      title: input.title,
      description: input.description || null
    }
  });
}

export async function getTraining(id: string) {
  const training = await prisma.training.findUnique({
    where: { id },
    include: trainingDetailInclude
  });

  return training ? withTrainingMetrics(training) : null;
}

export async function updateTraining(id: string, input: UpdateTrainingInput) {
  return prisma.training.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description === undefined ? undefined : input.description || null
    }
  });
}

export async function createTrainingItem(
  trainingId: string,
  input: CreateTrainingItemInput
) {
  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { id: true }
  });

  if (!training) {
    return null;
  }

  const maxPositionItem = await prisma.trainingItem.findFirst({
    where: { trainingId },
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
      position: (maxPositionItem?.position ?? -1) + 1
    }
  });
}

export async function updateTrainingItem(id: string, input: UpdateTrainingItemInput) {
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

export async function reorderTrainingItems(
  trainingId: string,
  input: ReorderTrainingItemsInput
) {
  const items = await prisma.trainingItem.findMany({
    where: {
      id: { in: input.itemIds },
      trainingId
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
