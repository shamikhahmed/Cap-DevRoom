# Cap DevRoom — Deploy

**Primary:** run locally on your Mac (`npm run dev:stack`).

**Optional:** Render web service with persistent disk for SQLite.

---

## Local (recommended)

```bash
cd ~/Desktop/Cap-DevRoom
npm install && npm run rebuild:packages
npm run db:push
cp dashboard/.env.example dashboard/.env.local
npm run dev:stack
```

---

## Render (optional)

1. Push `Cap-DevRoom` to GitHub
2. Connect repo in Render → New Blueprint → `render.yaml`
3. Set `CURSOR_API_KEY` in Dashboard
4. Persistent disk mounts at `/data` for `devroom.db`

**Note:** Sandboxes are large — cloud deploy is for dashboard-only ops; sync sandboxes locally before agent runs.

---

## Environment

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | SQLite path (`file:../data/devroom.db` locally) |
| `CURSOR_API_KEY` | Agent runs via Cursor SDK |
| `DEVROOM_ROOT` | Cap-DevRoom root path |
| `DEVROOM_SANDBOX_ROOT` | Sandbox copies |

See [TESTING.md](TESTING.md) for smoke checklist.
