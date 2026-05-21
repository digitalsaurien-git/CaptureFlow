import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  createTaskSchema,
  reorderTasksSchema,
  updateProjectSchema,
  updateTaskSchema
} from "@/lib/project-validations";

describe("project validations", () => {
  it("accepts a valid project creation payload", () => {
    const result = createProjectSchema.safeParse({
      title: "Projet CaptureFlow"
    });

    expect(result.success).toBe(true);
  });

  it("rejects project creation without a title", () => {
    const result = createProjectSchema.safeParse({
      title: "   "
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty project update payload", () => {
    const result = updateProjectSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects an invalid project status", () => {
    const result = updateProjectSchema.safeParse({
      status: "BLOCKED"
    });

    expect(result.success).toBe(false);
  });
});

describe("task validations", () => {
  it("accepts a valid task creation payload", () => {
    const result = createTaskSchema.safeParse({
      title: "Premiere tache"
    });

    expect(result.success).toBe(true);
  });

  it("rejects task creation without a title", () => {
    const result = createTaskSchema.safeParse({
      title: ""
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty task update payload", () => {
    const result = updateTaskSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects an invalid task status", () => {
    const result = updateTaskSchema.safeParse({
      status: "WAITING"
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid progress value", () => {
    const result = updateTaskSchema.safeParse({
      progress: "P50"
    });

    expect(result.success).toBe(false);
  });

  it("accepts and rejects reorder payloads", () => {
    expect(reorderTasksSchema.safeParse({ taskIds: ["task-1", "task-2"] }).success).toBe(
      true
    );
    expect(reorderTasksSchema.safeParse({ taskIds: [] }).success).toBe(false);
  });
});
