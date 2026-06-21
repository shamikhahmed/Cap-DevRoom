import { NextResponse } from "next/server";
import { portfolioScores } from "../../../lib/devroom/priority";

export async function GET() {
  return NextResponse.json({ scores: await portfolioScores() });
}
