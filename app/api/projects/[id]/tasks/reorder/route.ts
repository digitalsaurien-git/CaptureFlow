import { NextResponse } from "next/server";
import { reorderProjectTasks } from "@/lib/project-service";
import { reorderTasksSchema } from "@/lib/project-validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = reorderTasksSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid reorder payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const tasks = await reorderProjectTasks(id, result.data);

  if (!tasks) {
    return NextResponse.json(
      { error: "All tasks must belong to the project." },
      { status: 400 }
    );
  }

  return NextResponse.json({ tasks });
}
