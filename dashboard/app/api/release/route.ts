import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "../../../lib/devroom/rate-limit";

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req, "release", { limit: 10, windowMs: 60_000 });
  if (rl) return rl;

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  try {
    if (projectId) {
      const { generateReleasePackage } = await import("../../../lib/devroom/release");
      const pkg = await generateReleasePackage(projectId);
      return NextResponse.json({ package: pkg });
    }
    const { generateAllReleasePackages } = await import("../../../lib/devroom/release");
    const packages = await generateAllReleasePackages();
    return NextResponse.json({ packages });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
