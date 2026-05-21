import { NextResponse } from "next/server";
import { updateCaptureStatus } from "@/lib/capture-service";
import { updateCaptureStatusSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = updateCaptureStatusSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid status payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const capture = await updateCaptureStatus(id, result.data.status);
    return NextResponse.json({ capture });
  } catch {
    return NextResponse.json({ error: "Capture not found." }, { status: 404 });
  }
}
