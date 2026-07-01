# DevRoom liveness & application care

Cap DevRoom is a **real** engineering office — activity, scans, and promotions are backed by SQLite and filesystem state. Nothing is fabricated.

## What runs automatically

| Signal | Trigger | Cost |
|--------|---------|------|
| Job worker drain | Every 3s when jobs pending | Cursor credits when jobs run |
| Heartbeat | Every 60s (`ensureHeartbeat` on `/api/health`) | Free |
| Scheduled crews | Every 15min if `DEVROOM_HEARTBEAT=1` | Cursor credits for agent crews |
| Uptime checks | Every 30min (unless `DEVROOM_UPTIME=0`) | Free |
| Sandbox hygiene | Hourly — auto-sync if stale 3+ days and no un-promoted diffs | Free |
| Readiness scan (bootstrap) | `npm run devroom:bootstrap` | Free |

## Environment variables

```bash
# dashboard/.env.local
CURSOR_API_KEY=...           # Required for agent runs
DEVROOM_HEARTBEAT=1          # Auto-run due scheduled crews in dev
DEVROOM_UPTIME=0             # Disable live URL checks
DEVROOM_PROMOTE=0            # Disable promote-to-Projects API
MARKROOM_WEBHOOK_URL=...     # Notify Markroom when handoff issues complete
DEVROOM_DAILY_BUDGET_USD=5   # Daily spend cap
```

## First-time setup

```bash
npm run sync:sandboxes    # Pull 8 Cap apps into sandboxes/
npm run dev:stack         # DB + dashboard :3000
npm run devroom:bootstrap # Free readiness scan + activity
```

## Promotion paths

1. **Local** — `/promote` → review diff → Promote to `~/Desktop/Projects/{App}`
2. **Cloud** — Approve `[Cloud]` task or use Open Cloud PR → GitHub PR via Cursor

## Markroom integration

- **Inbound:** `POST /api/handoff` from Markroom creates issue + approval
- **Outbound:** Set `MARKROOM_WEBHOOK_URL` — DevRoom POSTs when linked issue is `done`

See [MARKROOM-ALIVE.md](./MARKROOM-ALIVE.md) for the Markroom-side upgrade command.
