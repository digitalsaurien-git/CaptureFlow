import { z } from "zod";

export const captureStatusSchema = z.enum(["INBOX", "TODO", "DONE", "ARCHIVED"]);

export const createCaptureSchema = z.object({
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().max(5000).optional(),
  source: z.string().trim().max(200).optional()
});

export const updateCaptureSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    content: z.string().trim().max(5000).optional().nullable(),
    source: z.string().trim().max(200).optional().nullable()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export const updateCaptureStatusSchema = z.object({
  status: captureStatusSchema.exclude(["ARCHIVED"])
});

export type CreateCaptureInput = z.infer<typeof createCaptureSchema>;
export type UpdateCaptureInput = z.infer<typeof updateCaptureSchema>;
export type UpdateCaptureStatusInput = z.infer<typeof updateCaptureStatusSchema>;
