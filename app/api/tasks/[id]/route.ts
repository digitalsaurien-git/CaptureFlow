import { NextResponse } from "next/server";
import { archiveTask, updateTask } from "@/lib/project-service";
import { updateTaskSchema } from "@/lib/project-validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = updateTaskSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid task payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const task = await updateTask(id, result.data);
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const task = await archiveTask(id);
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
}
