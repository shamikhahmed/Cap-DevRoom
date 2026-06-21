import { NextResponse } from "next/server";
import { budgetStatus } from "../../../lib/devroom/budget";

export async function GET() {
  return NextResponse.json(await budgetStatus());
}
