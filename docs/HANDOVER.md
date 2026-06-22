# Cap · DevRoom — Handover

**Version:** 3.4.0 · **Updated:** 2026-06-22  
**Owner:** Shamikh Ahmed · **Sibling:** [Cap-Markroom](~/Desktop/Cap-Markroom)

---

## What this is

Cap · DevRoom is the **autonomous CTO office** for the eight Cap PWAs. 23 codename agents across 8 departments run in **sandbox copies only** under `sandboxes/`. Live repos at `~/Desktop/Projects/{VaultCap,...}` are read-only — agents never write there.

---

## Location & paths

| Path | Purpose |
|------|---------|
| `~/Desktop/Cap-DevRoom` | DevRoom monorepo |
| `~/Desktop/Cap-Markroom` | Marketing office (Clerk, Nest, Postgres) |
| `~/Desktop/Projects/{App}` | Live Cap sources (read/sync only) |
| `~/Desktop/Cap-DevRoom/sandboxes/{App}` | Agent write targets |
| `~/Desktop/Cap-DevRoom/data/devroom.db` | SQLite (approvals, jobs, memory, issues, readiness, budget) |

---

## Quick start

```bash
cd ~/Desktop/Cap-DevRoom
npm install && npm run rebuild:packages && npm run db:push
cp dashboard/.env.example dashboard/.env.local   # CURSOR_API_KEY + DEVROOM_API_TOKEN
npm run sync:sandboxes
npm run dev:stack
# → http://localhost:3000
```

---

## Department roster (8 offices, 23 agents)

| Dept | Agents | Model tier |
|------|--------|-----------|
| Executive | APEX, PITCH | opus |
| Product | PRISM, LENS | sonnet |
| Engineering | FORGE, PIXEL, CORE, NOVA, ECHO, ATLAS | opus/sonnet |
| QA | SHIELD, RADAR | sonnet |
| Security | VAULT, CIPHER | opus |
| Release | DELTA, NEXUS | sonnet |
| Portfolio | SIGMA | sonnet |
| Content | SCROLL, QUILL, SLIDE, INK | haiku/sonnet |

Model routing: `resolveModelId()` in `lib/devroom/agents.ts` maps haiku→`cursor-fast`, opus/sonnet→`composer-2`.

---

## Core loop

1. **Briefing** (`/briefing`) — morning priorities + AI briefing.
2. **CEO command** (`/` → APEX) — delegates; Medium/High → approval queue.
3. **Approvals** (`/approvals`) — founder approves; server runs `runAgentAfterApproval`.
4. **Departments** (`/departments`) — 8 offices, filterable agent grid with live job dots.
5. **Launch** (`/launch`) — readiness per app, score, per-category checks (27 total including Play Store).
6. **Release** (`/release`) — GO / CONDITIONAL GO / NO GO per active project.
7. **Security** (`/security`) — VAULT static scan; grade A–F per app, findings drilldown.
8. **Agents** (`/agents`) — org chart, token salaries, activate → sandbox run.

---

## Agent modes

| Mode | Route | Writes to |
|------|-------|-----------|
| Local | `POST /api/agent/run` | `sandboxes/{App}/` only |
| Cloud | `POST /api/agent/cloud` | GitHub branch → PR (Medium/High needs approval) |

---

## Security invariants

- Agents **must not** write to `DEVROOM_PROJECTS_ROOT`.
- `resolveSandbox()` uses `fs.realpathSync` — symlink escapes blocked.
- No client `approved` flag on run APIs.
- `DEVROOM_API_TOKEN` required for iPhone/LAN access (copy via Settings page).
- `/api/settings/token` — localhost-only endpoint.
- `/api/approvals/reset` — development only (`isDevOnlyRoute`).

---

## Key libs

| File | Purpose |
|------|---------|
| `lib/devroom/agents.ts` | 23 agent defs + `resolveModelId()` |
| `lib/devroom/worker.ts` | Durable job execution, per-agent model routing |
| `lib/devroom/readiness.ts` | 27-check readiness scan (incl. Play Store) |
| `lib/devroom/release.ts` | GO/CONDITIONAL_GO/NO_GO package generator |
| `lib/devroom/security.ts` | Static security analysis, grade A–F |
| `lib/devroom/priority.ts` | Portfolio investment scoring |
| `lib/devroom/scheduled.ts` | Autonomous crew scheduling + seeded defaults |
| `lib/devroom/budget.ts` | Daily spend cap + `BudgetDay` ledger |

---

## Env vars (`dashboard/.env.local`)

```
CURSOR_API_KEY=
DEVROOM_API_TOKEN=          # iPhone/LAN auth — copy from Settings page
DATABASE_URL=file:../../../data/devroom.db
DEVROOM_ROOT=~/Desktop/Cap-DevRoom
DEVROOM_SANDBOX_ROOT=.../sandboxes
DEVROOM_PROJECTS_ROOT=~/Desktop/Projects
DEVROOM_DAILY_BUDGET_USD=5
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

```bash
npm run doctor && npm run build && npm run type-check
```

---

## Markroom integration

- Markroom → `POST /api/handoff` with `{ codename, task, projectId, risk, source: "markroom" }`.
- Portfolio sync: `npm run sync:portfolio-check`.

---

## Known limits

- Render deploy: dashboard-only; sync sandboxes locally before agent runs.
- Cloud agents need GitHub connected in Cursor dashboard; branch prefix `capdevroom/`.
- `cursor-fast` model ID for haiku agents — verify against Cursor SDK changelog if runs fail.
- Play Store checks scan sandbox filesystem only (no live Play Console API).

---

*Cap family · Autonomous CTO office · Sandbox-first · v3.4.0*
