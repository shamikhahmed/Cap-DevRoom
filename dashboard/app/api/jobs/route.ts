import { NextResponse } from "next/server";
import { listJobs } from "../../../lib/devroom/jobs";

export async function GET() {
  const jobs = await listJobs(100);
  return NextResponse.json({ jobs });
}
