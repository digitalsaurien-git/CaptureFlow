import { NextResponse } from "next/server";
import { updateTrainingItem } from "@/lib/training-service";
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
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Training item not found." }, { status: 404 });
  }
}
