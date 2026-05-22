import { NextResponse } from "next/server";
import { createTrainingItem } from "@/lib/training-service";
import { createTrainingItemSchema } from "@/lib/training-validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = createTrainingItemSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid training item payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const item = await createTrainingItem(id, result.data);

  if (!item) {
    return NextResponse.json({ error: "Training not found." }, { status: 404 });
  }

  return NextResponse.json({ item }, { status: 201 });
}
