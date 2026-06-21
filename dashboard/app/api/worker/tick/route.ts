import { NextResponse } from "next/server";
import { drainWorker } from "../../../../lib/devroom/worker";

/** Serverless/cron drain endpoint — runs pending agent jobs. */
export async function GET() {
  const ran = await drainWorker(5);
  return NextResponse.json({ ran, count: ran.length });
}

export async function POST() {
  const ran = await drainWorker(5);
  return NextResponse.json({ ran, count: ran.length });
}
