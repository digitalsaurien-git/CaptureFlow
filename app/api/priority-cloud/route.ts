import { NextResponse } from "next/server";
import {
  createPriorityCloudItem,
  listPriorityCloudItems
} from "@/lib/priority-cloud-service";
import { createPriorityCloudItemSchema } from "@/lib/priority-cloud-validations";

export async function GET() {
  const items = await listPriorityCloudItems();

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = createPriorityCloudItemSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid priority cloud item payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const item = await createPriorityCloudItem(result.data);

  return NextResponse.json({ item }, { status: 201 });
}
