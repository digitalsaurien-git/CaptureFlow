import { NextResponse } from "next/server";
import { archiveCapture } from "@/lib/capture-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const capture = await archiveCapture(id);
    return NextResponse.json({ capture });
  } catch {
    return NextResponse.json({ error: "Capture not found." }, { status: 404 });
  }
}
