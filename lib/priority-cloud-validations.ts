import { z } from "zod";

const priorityWeightSchema = z.number().int().min(1).max(5);

export const createPriorityCloudItemSchema = z.object({
  label: z.string().trim().min(1).max(100),
  weight: priorityWeightSchema.optional().default(3)
});

export const updatePriorityCloudItemSchema = z
  .object({
    label: z.string().trim().min(1).max(100).optional(),
    weight: priorityWeightSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export type CreatePriorityCloudItemInput = z.infer<
  typeof createPriorityCloudItemSchema
>;
export type UpdatePriorityCloudItemInput = z.infer<
  typeof updatePriorityCloudItemSchema
>;
