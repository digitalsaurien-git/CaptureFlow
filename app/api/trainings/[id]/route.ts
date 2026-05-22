import { NextResponse } from "next/server";
import { archiveTraining, getTraining, updateTraining } from "@/lib/training-service";
import { updateTrainingSchema } from "@/lib/training-validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const training = await getTraining(id);

  if (!training) {
    return NextResponse.json({ error: "Training not found." }, { status: 404 });
  }

  return NextResponse.json({ training });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = updateTrainingSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid training payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const training = await updateTraining(id, result.data);
    if (!training) {
      return NextResponse.json({ error: "Training not found." }, { status: 404 });
    }

    return NextResponse.json({ training });
  } catch {
    return NextResponse.json({ error: "Training not found." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const training = await archiveTraining(id);

  if (!training) {
    return NextResponse.json({ error: "Training not found." }, { status: 404 });
  }

  return NextResponse.json({ training });
}
