import { NextResponse } from "next/server";
import { getAgentMemory } from "../../../lib/devroom/memory";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const codename = searchParams.get("codename");
  if (!codename) {
    return NextResponse.json({ error: "codename required" }, { status: 400 });
  }
  const bullets = await getAgentMemory(codename);
  return NextResponse.json({ codename: codename.toUpperCase(), bullets });
}
