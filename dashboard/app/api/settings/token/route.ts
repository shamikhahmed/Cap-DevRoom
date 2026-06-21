import { NextRequest, NextResponse } from "next/server";
import { isLocalHost } from "../../../../lib/devroom/auth";

// Only expose to localhost — never to LAN/Render.
export async function GET(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (!isLocalHost(host)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const token = process.env.DEVROOM_API_TOKEN?.trim() || null;
  return NextResponse.json({ token });
}
