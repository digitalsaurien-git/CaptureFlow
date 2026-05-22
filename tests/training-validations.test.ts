import { describe, expect, it } from "vitest";
import {
  createTrainingItemSchema,
  createTrainingSchema,
  reorderTrainingItemsSchema,
  updateTrainingItemSchema,
  updateTrainingSchema
} from "@/lib/training-validations";

describe("training validations", () => {
  it("accepts a valid training creation payload", () => {
    const result = createTrainingSchema.safeParse({
      title: "Formation CaptureFlow"
    });

    expect(result.success).toBe(true);
  });

  it("rejects training creation without a title", () => {
    const result = createTrainingSchema.safeParse({
      title: "   "
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty training update payload", () => {
    const result = updateTrainingSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe("training item validations", () => {
  it("accepts a valid item creation payload", () => {
    const result = createTrainingItemSchema.safeParse({
      title: "Video 1",
      durationMinutes: 12
    });

    expect(result.success).toBe(true);
  });

  it("rejects item creation without a title", () => {
    const result = createTrainingItemSchema.safeParse({
      title: "",
      durationMinutes: 12
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-positive durations", () => {
    expect(
      createTrainingItemSchema.safeParse({
        title: "Video 1",
        durationMinutes: 0
      }).success
    ).toBe(false);

    expect(
      createTrainingItemSchema.safeParse({
        title: "Video 1",
        durationMinutes: -5
      }).success
    ).toBe(false);
  });

  it("rejects non-integer durations", () => {
    const result = createTrainingItemSchema.safeParse({
      title: "Video 1",
      durationMinutes: 12.5
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid progress value", () => {
    const result = updateTrainingItemSchema.safeParse({
      progress: "P50"
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty item update payload", () => {
    const result = updateTrainingItemSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("accepts and rejects reorder payloads", () => {
    expect(
      reorderTrainingItemsSchema.safeParse({
        itemIds: ["item-1", "item-2"]
      }).success
    ).toBe(true);

    expect(
      reorderTrainingItemsSchema.safeParse({
        itemIds: []
      }).success
    ).toBe(false);
  });
});
