import { NextResponse } from "next/server";
import { archiveProject, getProject, updateProject } from "@/lib/project-service";
import { updateProjectSchema } from "@/lib/project-validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const project = await getProject(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = updateProjectSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid project payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const project = await updateProject(id, result.data);
    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const project = await archiveProject(id);
    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
}
