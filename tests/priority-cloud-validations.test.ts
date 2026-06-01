import { describe, expect, it } from "vitest";
import {
  createPriorityCloudItemSchema,
  updatePriorityCloudItemSchema
} from "@/lib/priority-cloud-validations";

describe("priority cloud validations", () => {
  it("accepts a valid creation payload", () => {
    const result = createPriorityCloudItemSchema.safeParse({
      label: "Relancer devis",
      weight: 3
    });

    expect(result.success).toBe(true);
  });

  it("uses weight 3 by default", () => {
    const result = createPriorityCloudItemSchema.safeParse({
      label: "Appel client"
    });

    expect(result.success).toBe(true);
    expect(result.success ? result.data.weight : null).toBe(3);
  });

  it("rejects an empty label", () => {
    const result = createPriorityCloudItemSchema.safeParse({
      label: "   ",
      weight: 3
    });

    expect(result.success).toBe(false);
  });

  it("rejects a label that is too long", () => {
    const result = createPriorityCloudItemSchema.safeParse({
      label: "a".repeat(101),
      weight: 3
    });

    expect(result.success).toBe(false);
  });

  it("accepts weights from 1 to 5", () => {
    for (const weight of [1, 2, 3, 4, 5]) {
      expect(
        createPriorityCloudItemSchema.safeParse({
          label: `Priorite ${weight}`,
          weight
        }).success
      ).toBe(true);
    }
  });

  it("rejects weight 0", () => {
    const result = createPriorityCloudItemSchema.safeParse({
      label: "Trop bas",
      weight: 0
    });

    expect(result.success).toBe(false);
  });

  it("rejects weight 6", () => {
    const result = createPriorityCloudItemSchema.safeParse({
      label: "Trop haut",
      weight: 6
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer weights", () => {
    const result = createPriorityCloudItemSchema.safeParse({
      label: "Demi priorite",
      weight: 2.5
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty update payload", () => {
    const result = updatePriorityCloudItemSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("accepts a valid label update", () => {
    const result = updatePriorityCloudItemSchema.safeParse({
      label: "Nouveau libelle"
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid weight update", () => {
    const result = updatePriorityCloudItemSchema.safeParse({
      weight: 5
    });

    expect(result.success).toBe(true);
  });
});
