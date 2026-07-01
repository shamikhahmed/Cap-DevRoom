# Cap DevRoom Dashboard

Next.js command center for Cap DevRoom — agent orchestration, approvals, sandboxes, and portfolio care.

## Quick start

```bash
cd .. && npm run dev:stack
# Optional after first boot:
npm run devroom:bootstrap
```

Set `dashboard/.env.local`:

- `CURSOR_API_KEY` — agent runs
- `DEVROOM_HEARTBEAT=1` — auto-run scheduled crews in dev
- `MARKROOM_WEBHOOK_URL` — notify Markroom on handoff completion

See [../docs/LIVENESS.md](../docs/LIVENESS.md) for the full automation map.
