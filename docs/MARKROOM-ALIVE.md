# Markroom — make it alive (copy into Cap-Markroom chat)

Open a **new Cursor chat** at `~/Desktop/Projects/Cap-Markroom` (or your Markroom path) and paste everything below the line.

---

```
You are upgrading Cap · Markroom to match Cap · DevRoom's new "living office" standard.
DevRoom at ~/Desktop/Cap-DevRoom now has: honest activity feeds, portfolio context in agent prompts,
promotion flow, uptime monitoring, Markroom handoff webhooks, and real agent task derivation.

READ BOTH CODEBASES before changing anything. Do not break Clerk, Nest API, Postgres, or tenancy.

## Goal

Markroom should feel as alive as DevRoom:
- Real activity from agent runs (not static seeds when DB has data)
- Honest empty states (no green "live" pulse when idle)
- Data-driven greeting / dashboard metrics
- Send engineering handoffs to DevRoom with one click
- Receive completion webhooks when DevRoom finishes work

## Phase 1 — Honesty (no fake busy)

1. **Activity feed** — Poll real API; green pulse only when jobs PROCESSING or log non-empty
2. **Agent cards** — Derive "current task" from jobs/approvals/DB, not hardcoded marketing strings
3. **Greeting banner** — Only claim briefing exists if generated today
4. **Empty states** — Show actionable CTAs (generate content, run campaign scan) instead of hiding sections

## Phase 2 — Real telemetry

5. **appendActivity** on: job queued, processing, failed, completed; approval decisions; campaign scans
6. **Agent status** — PROCESSING jobs → active; else recency-based idle/standby
7. **Server source of truth** — Prefer API/Postgres over localStorage split-brain (audit web app)

## Phase 3 — DevRoom handoff (bidirectional)

8. **Send to DevRoom** button on agent output / approval when task implies engineering:
   POST http://localhost:3000/api/handoff (or production DevRoom URL)
   Body: { "source": "markroom", "codename": "FORGE"|"PIXEL"|..., "task": "...", "projectId": "VaultCap", "risk": "Medium" }

9. **Webhook receiver** — New Nest route `POST /webhooks/devroom`:
   Payload: { event: "handoff.completed", handoffId, issueKey, projectId, status, prUrl }
   Update marketing campaign / content task status in Markroom DB
   Show toast in dashboard: "DevRoom completed VAULT-12"

10. **Env** — MARKROOM_WEBHOOK_SECRET, DEVROOM_HANDOFF_URL in Markroom .env

## Phase 4 — Portfolio parity

11. **sync-portfolio-check** — Diff offerings vs DevRoom capricorn-ecosystem.ts; warn on drift
12. **Deliverables gap scan** — Per offering: missing blog, landing SEO, social draft (rules-based)
13. **Live status** — If offering has liveUrl, optional HEAD check like DevRoom uptime.ts

## Phase 5 — Autonomous marketing care

14. **Scheduled crews** (Bull/cron): weekly content audit, daily SEO scan, campaign readiness
15. **DEVROOM_HEARTBEAT equivalent** — `MARKROOM_HEARTBEAT=1` runs due crews in dev
16. **Bootstrap script** — `npm run markroom:bootstrap` runs free rules-based portfolio scan

## Phase 6 — Docs

17. Update README, CHANGELOG, version sync
18. Add docs/LIVENESS.md mirroring DevRoom

## Non-negotiables

- Minimize scope; match Markroom Nest/shadcn conventions
- Honest AI marketing (Smart Assistant vs LLM)
- Do not remove Clerk, Postgres, Redis/Bull, multi-tenant
- Reliability > UX > Security

## Test plan

- Fresh DB → dashboard shows honest idle, no fake pulse
- Run one agent job → activity shows queue → processing → done
- Send handoff → DevRoom /approvals shows pending item
- Mock DevRoom webhook → Markroom updates campaign status
- Scheduled crew due → runs without manual button

Implement in order. Ship Phase 1–3 first for cross-office loop, then 4–6.
```

---

## DevRoom side (already built)

- Handoff API: `POST /api/handoff` → creates Issue + Approval
- Completion webhook: set `MARKROOM_WEBHOOK_URL` in `dashboard/.env.local`
- Docs: [LIVENESS.md](./LIVENESS.md)
