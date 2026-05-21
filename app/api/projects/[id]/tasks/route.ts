import { NextResponse } from "next/server";
import { createTask } from "@/lib/project-service";
import { createTaskSchema } from "@/lib/project-validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = createTaskSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid task payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const task = await createTask(id, result.data);

  if (!task) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ task }, { status: 201 });
}
