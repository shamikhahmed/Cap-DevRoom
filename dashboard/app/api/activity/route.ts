import { NextResponse } from "next/server";
import { getActivityLog } from "../../../lib/devroom/store";

export async function GET() {
  const log = await getActivityLog();
  return NextResponse.json({ log });
}
