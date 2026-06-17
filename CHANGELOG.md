# Changelog

All notable changes to **Cap · DevRoom** are documented here.

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
