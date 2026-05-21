import { z } from "zod";

export const progressStepSchema = z.enum(["P0", "P20", "P40", "P60", "P80", "P100"]);
export const projectStatusSchema = z.enum(["ACTIVE", "PAUSED", "DONE", "ARCHIVED"]);
export const taskStatusSchema = z.enum(["TODO", "DOING", "DONE", "ARCHIVED"]);

export const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).optional()
});

export const updateProjectSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    status: projectStatusSchema.optional(),
    progress: progressStepSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).optional(),
  status: taskStatusSchema.optional(),
  progress: progressStepSchema.optional()
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    status: taskStatusSchema.optional(),
    progress: progressStepSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export const reorderTasksSchema = z.object({
  taskIds: z.array(z.string().min(1)).min(1)
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
