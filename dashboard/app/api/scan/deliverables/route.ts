import { NextResponse } from "next/server";
import { scanDeliverables, deliverablesSummary } from "../../../../lib/devroom/deliverables";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const project = url.searchParams.get("project");
  const hits = scanDeliverables(project ? [project] : undefined);
  return NextResponse.json({
    hits,
    summary: deliverablesSummary(hits),
    count: hits.length,
  });
}
