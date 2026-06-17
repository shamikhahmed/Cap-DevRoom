import { NextResponse } from "next/server";
import { getNetworkInfo } from "../../../lib/devroom/network";

export async function GET() {
  return NextResponse.json(getNetworkInfo());
}
