import { NextResponse } from "next/server";
import { createCapture, listCaptures } from "@/lib/capture-service";
import { createCaptureSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const archived = searchParams.get("archived") === "true";
  const captures = await listCaptures({ archived });

  return NextResponse.json({ captures });
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = createCaptureSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid capture payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const capture = await createCapture(result.data);

  return NextResponse.json({ capture }, { status: 201 });
}
