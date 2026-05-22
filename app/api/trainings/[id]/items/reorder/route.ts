import { NextResponse } from "next/server";
import { reorderTrainingItems } from "@/lib/training-service";
import { reorderTrainingItemsSchema } from "@/lib/training-validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = reorderTrainingItemsSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid reorder payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const items = await reorderTrainingItems(id, result.data);

  if (!items) {
    return NextResponse.json(
      { error: "All items must belong to the training." },
      { status: 400 }
    );
  }

  return NextResponse.json({ items });
}
