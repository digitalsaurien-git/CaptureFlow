import { NextResponse } from "next/server";
import {
  archivePriorityCloudItem,
  updatePriorityCloudItem
} from "@/lib/priority-cloud-service";
import { updatePriorityCloudItemSchema } from "@/lib/priority-cloud-validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = updatePriorityCloudItemSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid priority cloud item payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const item = await updatePriorityCloudItem(id, result.data);

  if (!item) {
    return NextResponse.json(
      { error: "Priority cloud item not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const item = await archivePriorityCloudItem(id);

  if (!item) {
    return NextResponse.json(
      { error: "Priority cloud item not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ item });
}
