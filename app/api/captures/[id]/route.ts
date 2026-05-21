import { NextResponse } from "next/server";
import { getCapture, updateCapture } from "@/lib/capture-service";
import { updateCaptureSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const capture = await getCapture(id);

  if (!capture) {
    return NextResponse.json({ error: "Capture not found." }, { status: 404 });
  }

  return NextResponse.json({ capture });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = updateCaptureSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid capture payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const capture = await updateCapture(id, result.data);
    return NextResponse.json({ capture });
  } catch {
    return NextResponse.json({ error: "Capture not found." }, { status: 404 });
  }
}
