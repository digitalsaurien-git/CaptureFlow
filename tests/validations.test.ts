import { describe, expect, it } from "vitest";
import {
  createCaptureSchema,
  updateCaptureSchema,
  updateCaptureStatusSchema
} from "@/lib/validations";

describe("capture validations", () => {
  it("accepts a minimal capture", () => {
    const result = createCaptureSchema.safeParse({
      title: "Nouvelle idee"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = createCaptureSchema.safeParse({
      title: "   "
    });

    expect(result.success).toBe(false);
  });

  it("accepts optional content and source", () => {
    const result = createCaptureSchema.safeParse({
      title: "Capture complete",
      content: "Contenu libre",
      source: "manuel"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty update payload", () => {
    const result = updateCaptureSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("accepts simple active statuses", () => {
    expect(updateCaptureStatusSchema.safeParse({ status: "INBOX" }).success).toBe(true);
    expect(updateCaptureStatusSchema.safeParse({ status: "TODO" }).success).toBe(true);
    expect(updateCaptureStatusSchema.safeParse({ status: "DONE" }).success).toBe(true);
  });

  it("rejects ARCHIVED in the status update route", () => {
    const result = updateCaptureStatusSchema.safeParse({
      status: "ARCHIVED"
    });

    expect(result.success).toBe(false);
  });
});
