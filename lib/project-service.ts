import type { Prisma, ProgressStep, ProjectStatus, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateProjectInput,
  CreateTaskInput,
  ReorderTasksInput,
  UpdateProjectInput,
  UpdateTaskInput
} from "@/lib/project-validations";

const projectDetailInclude = {
  tasks: {
    where: { status: { not: "ARCHIVED" as const } },
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
} satisfies Prisma.ProjectInclude;

export async function listProjects() {
  return prisma.project.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" }
  });
}

export async function createProject(input: CreateProjectInput) {
  return prisma.project.create({
    data: {
      title: input.title,
      description: input.description || null
    }
  });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: projectDetailInclude
  });
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  return prisma.project.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description === undefined ? undefined : input.description || null,
      status: input.status as ProjectStatus | undefined,
      progress: input.progress as ProgressStep | undefined
    }
  });
}

export async function archiveProject(id: string) {
  return prisma.project.update({
    where: { id },
    data: {
      status: "ARCHIVED"
    }
  });
}

export async function createTask(projectId: string, input: CreateTaskInput) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      status: { not: "ARCHIVED" }
    },
    select: { id: true }
  });

  if (!project) {
    return null;
  }

  const maxPositionTask = await prisma.task.findFirst({
    where: { projectId },
    orderBy: { position: "desc" },
    select: { position: true }
  });

  const status = input.status ?? "TODO";
  const progress = input.progress ?? (status === "DONE" ? "P100" : "P0");

  return prisma.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description || null,
      status,
      progress,
      position: (maxPositionTask?.position ?? -1) + 1
    }
  });
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const progress = input.progress ?? (input.status === "DONE" ? "P100" : undefined);

  return prisma.task.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description === undefined ? undefined : input.description || null,
      status: input.status as TaskStatus | undefined,
      progress: progress as ProgressStep | undefined
    }
  });
}

export async function archiveTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: {
      status: "ARCHIVED"
    }
  });
}

export async function reorderProjectTasks(projectId: string, input: ReorderTasksInput) {
  const tasks = await prisma.task.findMany({
    where: {
      id: { in: input.taskIds },
      projectId
    },
    select: { id: true }
  });

  if (tasks.length !== input.taskIds.length) {
    return null;
  }

  return prisma.$transaction(
    input.taskIds.map((taskId, position) =>
      prisma.task.update({
        where: { id: taskId },
        data: { position }
      })
    )
  );
}
