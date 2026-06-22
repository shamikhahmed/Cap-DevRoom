# Changelog

All notable changes to **Cap · DevRoom** are documented here.

## [3.4.0] — 2026-06-22 — Model routing, Play Store checks, Release packages UI

### Agent model routing
- `DevroomAgentDef` gains `defaultModel?: "opus" | "sonnet" | "haiku"` — all 22 agents tagged.
- `resolveModelId()` in `lib/devroom/agents.ts` maps haiku → `cursor-fast`, opus/sonnet → `composer-2`.
- Worker (`lib/devroom/worker.ts`) now passes per-agent model ID to Cursor SDK on every job execution. Routine monitoring agents (SCROLL, INK, SIGMA) use `cursor-fast`; strategy agents (APEX, FORGE, VAULT, PITCH) use `composer-2`.

### Play Store readiness
- 4 new AppStore checks in `lib/devroom/readiness.ts` (27 total): Android bundle, release keystore, fastlane/supply metadata, `google-services.json`.
- All scanned against sandbox filesystem same as existing iOS/AppStore checks.

### Release packages UI (`/release`)
- New page powered by existing `GET /api/release` — shows GO / CONDITIONAL GO / NO GO per active project.
- Expandable package cards: 6-point check breakdown (pass/warn/fail), completed work, risks, missing items, approval requirement flag.
- Summary pills, refresh button, DELTA attribution.
- `/release` added to sidebar nav and CommandPalette (17 commands total).

## [3.3.0] — 2026-06-22 — Autonomous CTO Office: Full Evolution

### Department system (8 offices)
- `DEPARTMENTS` export in `app/lib/data.ts` — Executive, Product, Engineering, QA, Security, Release, Portfolio, Content.
- `/departments` page — filterable office view, agent grid per dept, model tier badges (opus/sonnet/haiku), live active-job indicators, "Brief office" button.
- All agents tagged with `department` and `defaultModel` in `data.ts`.

### 10 new specialist agents (23 total)
NOVA (Mobile), ECHO (AI/ML), ATLAS (Infrastructure), RADAR (Bug Hunter), CIPHER (Compliance), DELTA (Release Manager), NEXUS (App Store Manager), SIGMA (Portfolio Analyst) — all with full system prompts, skills, and trigger keywords in `lib/devroom/agents.ts`.

### Security Office
- `lib/devroom/security.ts` — static analysis against all sandboxes: secrets detection (8 regex patterns for API keys/JWTs/AWS/Cursor/GitHub/private keys/DB strings), code patterns (eval/innerHTML XSS), dep audit (risky versions, lockfile, bloat), privacy compliance.
- Score 0–100, Grade A–F. Persists findings to `ReadinessCheck` table.
- `GET/POST /api/security` with rate limiting.
- `/security` page — grade rings per app, per-finding drilldown, re-scan action, "What VAULT scans" legend.
- Security badge in sidebar nav (red when criticals exist).

### Release Management Office
- `lib/devroom/release.ts` — `generateReleasePackage(projectId)` produces structured GO/CONDITIONAL_GO/NO_GO decision from 6 checks: readiness score, critical blockers, open bugs, QA validation, pending approvals, budget status.
- `GET /api/release` — single project or all active projects.

### CEO Dashboard v2
- **Critical alerts strip** (`CriticalAlerts` component) — security criticals, pending approvals, launch blockers surfaced above the fold; dismissable per alert.
- **Department chips** — 8 office status dots on home page showing active job count.
- **6 quick actions** updated to cover all major offices.

### Live metrics fixed
- Nav badge bugs always showed 0 — fixed: now fetches from `/api/health` (DB count) same as approvals.
- Home page `openBugs` now uses live DB count via health endpoint, not localStorage defaults.
- Sidebar Cursor API status now dynamic (was hardcoded "connected").

### Settings token UX
- `/api/settings/token` — localhost-only endpoint returning `DEVROOM_API_TOKEN`.
- Settings page shows masked token with Show/Copy — paste directly into iPhone app without SSH.

### Scheduled crews seeding
- `listScheduled()` now auto-seeds 4 default crews on first call (Weekly QA Sweep, Daily Readiness Scan, Weekly Debt Audit, Weekly Executive Briefing).

### CommandPalette expanded (16 commands)
Added: nav-departments, nav-security, act-security (security audit run).

## [3.2.0] — 2026-06-21 — Autonomous CTO Office

### Autonomous office
- **Launch-readiness engine** — self-checking checklist per app across Product, Engineering, QA, Release, App Store, and Launch. Auto-scans the real sandbox (README, manifest, icons incl. 1024px store icon, native wrapper, privacy policy, tests, CI, version) → pass/warn/fail with a weighted readiness score. Founder sign-off for manual gates (QA sign-off, store submission, GO-for-launch). `lib/devroom/readiness.ts`, `GET/POST /api/readiness`, `/launch`.
- **Portfolio prioritization + investment scoring** — deterministic per-app priority score and Ship / Invest / Fix / Hold / Cut signal from readiness, defect load, and momentum. `lib/devroom/priority.ts`, `GET /api/priority`.
- **Executive report** — board-level synthesis of readiness, priorities, issues, and spend (AI via APEX, graceful deterministic fallback). `lib/devroom/exec-report.ts`, `GET/POST /api/exec-report`.
- **Autonomous scheduled crews** — recurring agent runs (QA sweeps, readiness scans, debt audits) with cadence + run-due executor. `lib/devroom/scheduled.ts`, `/api/scheduled`.
- **Issue tracker** — Linear/Jira-style issues (status, priority, type, agent, per-project keys). `lib/devroom/issues.ts`, `/api/issues`, `/issues`.

### Reliability & safety
- **Durable job queue** — agent runs are enqueued and drained by a background worker (`lib/devroom/worker.ts`), never executed inside the HTTP request, so a gateway timeout can't orphan a run. In-process drain loop for long-lived servers + `GET/POST /api/worker/tick` for serverless/cron. Callers get a `jobId` instantly and poll `/api/jobs/{id}`.
- **Fixed P0 data-loss bug** — `set-db-url.ts` no longer clobbers an explicit `DATABASE_URL`, so Render's persistent disk is respected instead of writing to ephemeral build dir.
- **Durable sandbox lock** — replaced the in-memory Map lock with a DB-backed `SandboxLock` (survives restarts, safe across instances) + orphaned-job reaper.
- **Hard daily budget cap** — `BudgetDay` ledger blocks paid runs past `DEVROOM_DAILY_BUDGET_USD` (default $5); real SDK token/cost used when available (estimates flagged).
- **Rate limiting** — token-bucket guard on all AI endpoints (run, cloud, ceo, briefing, exec-report, scheduled).
- **Audit trail** — approval decisions record `decidedBy`/`decidedAt`; sensitive actions logged to `AuditLog`. `/api/audit`.
- **Hardened CEO parsing** — dependency-free schema validation + one retry replaces fragile regex/JSON.parse.
- Fixed `packages/database/.env` relative path so the Prisma CLI and the app share one DB file.

### Design (Apple-grade)
- Real San Francisco font stack (`-apple-system` → SF Pro), Apple HIG type scale + 8pt spacing tokens, continuous-corner radii, layered elevation, vibrancy/glass header + sidebar.
- **⌘K command palette** (jump anywhere, run scans/reports/crews) and a toast system.
- Live-data Projects page (real open-bug counts from the issue tracker — no more `openBugs: 0` fiction).

### Engineering
- Prisma: new models `Project`, `Issue`, `AuditLog`, `SandboxLock`, `ScheduledRun`, `BudgetDay`, `ReadinessCheck`; `Approval.decidedBy/decidedAt`.
- New libs: `locks`, `budget`, `audit`, `rate-limit`, `projects`, `issues`, `validate`, `readiness`, `priority`, `scheduled`, `exec-report`.

## [3.1.0] — 2026-06-17

### Mobile
- **Cap DevRoom Mobile** — Expo React Native app in `mobile/` connected to dashboard APIs (command center, approvals, agents, settings).

### Security
- **Fixed P0 approval bypass** — removed client-controlled `approved` flag from `/api/agent/run`; only server-side `runAgentAfterApproval` runs post-approval work.
- **Sandbox hardening** — `fs.realpathSync` validation ensures agent cwd stays inside `sandboxes/` and never resolves to live `~/Desktop/Projects/` paths.
- **API auth** — sensitive GET routes (jobs, approvals, diagnostics, roster, etc.) require `DEVROOM_API_TOKEN` on LAN/Render; `/api/approvals/reset` blocked in production.
- **Diagnostics** — Cursor account email redacted in production responses.

### Product
- **Desktop location** — canonical path is `~/Desktop/Cap-DevRoom` (Cap family parity with Markroom at `~/Desktop/Cap-Markroom`).
- **Token salaries** — per-agent token/cost/run totals on roster; tracked on `AgentJob` (`tokensUsed`, `costUsd`).
- **Org chart + profile cards** — Markroom-style agent roster at `/agents` with live status, salary, workspace links.
- **Light / dark / system theme** — Settings → Appearance toggle; CSS variable themes.
- **Markroom handoff** — `POST /api/handoff` accepts inbound engineering tasks from Cap · Markroom.
- **Cloud agents re-enabled** — `/api/agent/cloud` restored with approval gate for Medium/High risk.
- **Sandbox job queue** — one concurrent agent run per sandbox project.

### Engineering
- Prisma: `AgentJob.tokensUsed`, `AgentJob.costUsd`, new `Handoff` model.
- New API: `GET /api/agents/roster`.
- CEO command + briefing planning runs use sandbox cwd (not DevRoom root).
- Type-check: exclude `.next` from dashboard tsconfig.
- Portfolio context markdown moved to `docs/portfolio-context/`.
- Sandbox sync metadata (`data/sandbox-sync.json`) + stale warnings on `/projects`.
- Sidebar theme quick-switch; `.env.local` paths fixed for Desktop layout.

### Docs
- Added `docs/HANDOVER.md` for session continuity.
- Updated README, TESTING, SETUP, `.env.example` for v3.1.0 paths.

## [3.0.0] — 2026-06

- Turborepo monorepo with `@cap/devroom-shared`, `@cap/devroom-database`.
- Prisma SQLite replacing legacy JSON for approvals, jobs, memory, activity.
- 13 agents including **CORE** (Backend Architect).
- Per-agent workspaces, job log drawer, server sync, health banner, PWA v3.
