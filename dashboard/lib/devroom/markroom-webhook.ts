/** Outbound webhook when DevRoom completes Markroom handoff work. */

export interface MarkroomHandoffPayload {
  handoffId: string;
  issueId: string;
  issueKey: string;
  projectId: string;
  status: "done" | "blocked";
  prUrl?: string;
}

export async function notifyMarkroomHandoffComplete(payload: MarkroomHandoffPayload): Promise<void> {
  const url = process.env.MARKROOM_WEBHOOK_URL?.trim();
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "cap-devroom",
        event: "handoff.completed",
        ...payload,
        at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.error("[markroom-webhook]", e);
  }
}
