import { z } from "zod";
import { progressStepSchema } from "@/lib/project-validations";

export const createTrainingSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).optional()
});

export const updateTrainingSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(5000).optional().nullable()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export const createTrainingItemSchema = z.object({
  title: z.string().trim().min(1).max(160),
  durationMinutes: z.number().int().positive(),
  progress: progressStepSchema.optional(),
  isDone: z.boolean().optional()
});

export const updateTrainingItemSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    durationMinutes: z.number().int().positive().optional(),
    progress: progressStepSchema.optional(),
    isDone: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export const reorderTrainingItemsSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1)
});

export type CreateTrainingInput = z.infer<typeof createTrainingSchema>;
export type UpdateTrainingInput = z.infer<typeof updateTrainingSchema>;
export type CreateTrainingItemInput = z.infer<typeof createTrainingItemSchema>;
export type UpdateTrainingItemInput = z.infer<typeof updateTrainingItemSchema>;
export type ReorderTrainingItemsInput = z.infer<typeof reorderTrainingItemsSchema>;
