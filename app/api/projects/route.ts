import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/project-service";
import { createProjectSchema } from "@/lib/project-validations";

export async function GET() {
  const projects = await listProjects();

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = createProjectSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid project payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const project = await createProject(result.data);

  return NextResponse.json({ project }, { status: 201 });
}
