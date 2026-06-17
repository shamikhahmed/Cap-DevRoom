/** Critical alerts only — WhatsApp via webhook (Twilio, Zapier, or custom) */

export async function notifyCritical(
  title: string,
  body: string,
  level: "critical" | "approval" = "critical"
) {
  const url = process.env.WHATSAPP_WEBHOOK_URL?.trim();
  if (!url) return { sent: false, reason: "WHATSAPP_WEBHOOK_URL not set" };

  const payload = {
    title,
    body,
    level,
    source: "Cap DevRoom",
    time: new Date().toISOString(),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { sent: res.ok, status: res.status };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "fetch failed" };
  }
}
