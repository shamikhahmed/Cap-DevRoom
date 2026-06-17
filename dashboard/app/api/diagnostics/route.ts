import { NextResponse } from "next/server";
import { runDiagnostics } from "../../../lib/devroom/diagnostics";

export async function GET() {
  const result = await runDiagnostics();
  return NextResponse.json(result);
}
