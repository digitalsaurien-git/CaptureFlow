import { NextResponse } from "next/server";
import { createTraining, listTrainings } from "@/lib/training-service";
import { createTrainingSchema } from "@/lib/training-validations";

export async function GET() {
  const trainings = await listTrainings();

  return NextResponse.json({ trainings });
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = createTrainingSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid training payload.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const training = await createTraining(result.data);

  return NextResponse.json({ training }, { status: 201 });
}
