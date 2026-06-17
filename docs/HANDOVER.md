# Cap · DevRoom — Handover

**Version:** 3.1.0 · **Updated:** 2026-06-17  
**Owner:** Shamikh Ahmed · **Sibling:** [Cap-Markroom](~/Desktop/Cap-Markroom)

---

## What this is

Cap · DevRoom is the **virtual engineering office** for the eight Cap PWAs. Thirteen codename agents (APEX → INK) run in **sandbox copies only** under `sandboxes/`. Live repos live at `~/Desktop/Projects/{VaultCap,...}` and must never receive agent writes.

---

## Location & paths

| Path | Purpose |
|------|---------|
| `~/Desktop/Cap-DevRoom` | DevRoom monorepo (this repo) |
| `~/Desktop/Cap-Markroom` | Marketing office (Clerk, Nest, Postgres) |
| `~/Desktop/Projects/{App}` | Live Cap app sources (read/sync only) |
| `~/Desktop/Cap-DevRoom/sandboxes/{App}` | Agent write targets |
| `~/Desktop/Cap-DevRoom/data/devroom.db` | SQLite (approvals, jobs, memory, handoffs) |

---

## Quick start

```bash
cd ~/Desktop/Cap-DevRoom
npm install && npm run rebuild:packages && npm run db:push
cp dashboard/.env.example dashboard/.env.local   # CURSOR_API_KEY + optional DEVROOM_API_TOKEN
npm run sync:sandboxes
npm run dev:stack
# → http://localhost:3000
```

---

## Core loop

1. **Briefing** (`/briefing`) — morning priorities + AI briefing (requires `CURSOR_API_KEY`).
2. **CEO command** (`/` → APEX) — delegates to specialists; Medium/High → approval queue.
3. **Approvals** (`/approvals`) — founder approves; server runs `runAgentAfterApproval` (not client-bypassable).
4. **Agents** (`/agents`) — org chart, token salaries, activate → sandbox run.
5. **Deliverables** (`/deliverables`) — scans sandboxes for README/pitch/decks.

---

## Agent modes

| Mode | Route | Writes to |
|------|-------|-----------|
| Local | `POST /api/agent/run` | `sandboxes/{App}/` only |
| Cloud | `POST /api/agent/cloud` | GitHub branch → PR (Medium/High needs approval) |

---

## Security invariants (v3.1.0)

- Agents **must not** write to `DEVROOM_PROJECTS_ROOT`.
- `resolveSandbox()` + `validateSandboxPath()` use **realpath** — symlink escapes blocked.
- **No client `approved` flag** on run APIs.
- Set `DEVROOM_API_TOKEN` for iPhone/LAN; paste same token in Settings.
- `/api/approvals/reset` — development only.

---

## Markroom integration

- **Outbound:** Markroom can POST handoffs to `POST /api/handoff` with `{ codename, task, projectId, risk, source: "markroom" }`.
- **Portfolio sync:** `npm run sync:portfolio-check` (via script) diffs `capricorn-ecosystem.ts` vs Markroom.
- **Parity doc:** `Cap-Markroom/docs/DEVROOM-PARITY.md`.

---

## Env vars (`dashboard/.env.local`)

```
CURSOR_API_KEY=
DEVROOM_API_TOKEN=          # iPhone/LAN auth
DATABASE_URL=file:../data/devroom.db
DEVROOM_ROOT=~/Desktop/Cap-DevRoom
DEVROOM_SANDBOX_ROOT=.../sandboxes
DEVROOM_PROJECTS_ROOT=~/Desktop/Projects
WHATSAPP_WEBHOOK_URL=       # optional High-risk alerts
```

---

## Version touchpoints (keep in sync)

| File | Field |
|------|-------|
| `package.json` (root) | `version` |
| `packages/shared/src/brand.ts` | `APP_VERSION` |
| `dashboard/package.json` | `version` |
| `dashboard/public/sw.js` | `CACHE` name |
| `layout.tsx` meta | `cap-devroom-version` |
| `/api/health` | `version` response |

---

## Smoke test

See [TESTING.md](../TESTING.md). Minimum after changes:

```bash
npm run doctor && npm run build && npm run type-check
```

---

## Known limits

- Render deploy: dashboard-only; sync sandboxes locally before agent runs.
- Cloud agents need GitHub connected in Cursor dashboard; branch prefix `capdevroom/`.
- Token salaries estimate from Cursor usage when available, else output-length heuristic.

---

*Cap family · Engineering office · Sandbox-first.*
