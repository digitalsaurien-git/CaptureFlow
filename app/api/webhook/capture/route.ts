import { NextResponse, type NextRequest } from "next/server";
import { createCapture } from "@/lib/capture-service";
import { createCaptureSchema } from "@/lib/validations";
import { isWebhookAuthorized } from "@/lib/webhook-auth";

export async function POST(request: NextRequest) {
  if (!isWebhookAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
  }

  const body = await request.json();
  const result = createCaptureSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid webhook payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const capture = await createCapture(result.data);

  return NextResponse.json({ capture }, { status: 201 });
}
