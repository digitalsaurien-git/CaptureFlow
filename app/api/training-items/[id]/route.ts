import { NextResponse } from "next/server";
import { archiveTrainingItem, updateTrainingItem } from "@/lib/training-service";
import { updateTrainingItemSchema } from "@/lib/training-validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = updateTrainingItemSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid training item payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const item = await updateTrainingItem(id, result.data);
    if (!item) {
      return NextResponse.json({ error: "Training item not found." }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Training item not found." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const item = await archiveTrainingItem(id);

  if (!item) {
    return NextResponse.json({ error: "Training item not found." }, { status: 404 });
  }

  return NextResponse.json({ item });
}
