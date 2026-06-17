# Markroom Upgrade Prompt

Copy everything inside the block below into a **new Cursor chat** opened at `~/Desktop/Cap-Markroom`. This brings Markroom to parity with Cap DevRoom v3.1.0 while keeping Markroom’s SaaS strengths (Clerk auth, Nest API, Postgres, marketing landing).

---

## Copy-paste prompt

```
You are upgrading Cap · Markroom to production parity with Cap · DevRoom (engineering office) at ~/Desktop/Cap-DevRoom.

READ BOTH CODEBASES FULLY before changing anything. Do not break existing Clerk auth, Nest API, or multi-tenant flows.

## Goal

Both products are “Cap family offices” at the same quality bar:
- DevRoom = virtual engineering office (sandboxes, Cursor SDK, darker ops UI)
- Markroom = virtual marketing office (Clerk, Nest, Anthropic, public landing)

DevRoom already learned from Markroom (Prisma, agent memory, health banner, investor docs, server-backed state). Now Markroom must learn from DevRoom WITHOUT copying its dark UI — keep Markroom’s existing design system and marketing landing.

## Non-negotiables

1. Reliability > UX > Security > Performance > Scalability
2. Minimize scope — smallest correct diff
3. Match existing Markroom conventions (Nest modules, shadcn/Tailwind web, packages/*)
4. Honest AI marketing: rules-based = “Smart Assistant”; LLM only where integrated
5. Do NOT remove Clerk, Postgres, Redis/Bull, or multi-company tenancy
6. Version sync across README, manifest, sw, ONE-PAGER, WHY doc if you touch version

## Parity checklist — implement in order

### Phase A — Operator UX (learn from DevRoom UI patterns, not colors)

1. **Command-center density**
   - Dashboard should feel like a war room: live metrics row, agent roster with live status dots, recent activity feed (real API data, not static seeds when DB has rows).
   - Add/refine quick actions: Generate briefing, Approval inbox, Add task, Offerings catalog.

2. **Per-agent workspace pages**
   - DevRoom has `/agents/[codename]` with task input, project/company selector, recent jobs, agent memory panel.
   - Markroom: ensure each marketing agent has a workspace route (or enhance existing agent pages) with: company context, run action, recent jobs from Bull/DB, memory bullets, link back to roster.

3. **Live agent status**
   - DevRoom derives active/idle from recent AgentJob rows (`/api/agents/status`).
   - Markroom: add equivalent — active if job in last 60m, idle if last 24h, else standby. Wire to dashboard agent cards.

4. **ApiStatusBanner** — already exists; extend to show Cursor/Anthropic key missing vs DB down vs Redis down with actionable fix strings (mirror DevRoom banner tone).

### Phase B — Portfolio & handoff (learn from DevRoom)

5. **Shared Cap ecosystem sync**
   - DevRoom has `packages/shared/src/capricorn-ecosystem.ts`.
   - Markroom has its own copy. Add `scripts/sync-portfolio-check.sh` (or npm script) that diffs offering/app lists between repos and prints drift warnings.
   - Document in `docs/CAP-SUITE.md`: DevRoom owns engineering sandboxes; Markroom owns marketing offerings; manual sync until shared npm package exists.

6. **Deliverables / portfolio awareness**
   - DevRoom scans sandboxes for README, pitch, slides via `deliverables.ts`.
   - Markroom: add lightweight “deliverables gap” signal on Insights or Dashboard — per offering, flag missing blog post, landing copy, SEO meta, social draft (rules-based scan of DB + content library, not LLM).

7. **DevRoom handoff**
   - When marketing agent output implies engineering work (e.g. “needs API”, “fix bug”, “ship feature”), add structured `handoff` field on agent job or approval payload: `{ target: "devroom", codename: "FORGE"|"CORE"|..., task: "..." }`.
   - UI: “Send to DevRoom” button on approval detail copies handoff JSON to clipboard + shows deep-link instructions (DevRoom CEO command or agent workspace).

### Phase C — Memory & telemetry (align with DevRoom)

8. **Agent memory** — Markroom likely has AgentMemory; verify parity with DevRoom:
   - Max 10 bullets, trimmed excerpts, inject into agent prompts, record on job complete.
   - Show memory panel on agent workspace pages.

9. **Real activity telemetry**
   - DevRoom: ActivityLog table + `/api/activity` + home feed.
   - Markroom: ensure agent runs append to activity/audit log; dashboard feed pulls from API with demo fallback only when empty.

10. **Unified client/server sync**
    - DevRoom added `server-sync.ts` to hydrate localStorage from SQLite on load and persist tasks/priorities/approvals to API.
    - Markroom: audit any localStorage usage in web app; prefer React Query/SWR + API as source of truth. Remove split-brain where pages read localStorage but API has newer data.

### Phase D — Product & investor readiness (DevRoom now has these)

11. **Docs parity** — verify/update:
    - `docs/ONE-PAGER.md`
    - `docs/WHY-CAP-MARKROOM.md`
    - `docs/DEVICE-GUIDE.md`
    - Add `docs/DEVROOM-PARITY.md` — table comparing DevRoom vs Markroom capabilities and shared roadmap.

12. **Overnight / scheduled orchestration**
    - DevRoom has Cursor Automation template for morning briefing.
    - Markroom: document or add automation template for weekday CEO briefing + approval digest (use existing briefing agent + email if configured).

13. **PWA & version discipline**
    - Confirm service worker version matches package.json.
    - Confirm marketing landing version matches app meta.

### Phase E — Tests & verification

14. Run and fix until green:
    - `npm run build` (root turbo)
    - `npm run dev:stack` smoke: sign in → dashboard metrics → run one agent → approval appears → memory updates
    - Mobile: 390px width — no horizontal scroll on dashboard and approval inbox

## Architecture plans required BEFORE coding

Output briefly:
1. Architecture plan
2. Refactor plan
3. Migration plan (if schema changes)
4. Test plan
5. Rollback plan

Then implement phase by phase, verifying build after each phase.

## What NOT to do

- Do not replace Markroom UI with DevRoom dark theme
- Do not remove multi-company tenancy
- Do not add Cursor SDK to Markroom (keep Anthropic/Nest agent path)
- Do not init git or push unless I ask
- Do not over-engineer a shared monorepo merge — diff script + docs is enough for now

## Success criteria

Markroom feels as “operator-grade” as DevRoom: live roster, real telemetry, memory on workspaces, portfolio-aware insights, DevRoom handoff, investor docs current, health banner actionable, build passes.

Start by reading DevRoom’s latest files:
- `dashboard/app/components/ApiStatusBanner.tsx`
- `dashboard/app/lib/server-sync.ts`
- `dashboard/lib/devroom/memory.ts`
- `dashboard/lib/devroom/agent-status.ts`
- `docs/ONE-PAGER.md`, `docs/WHY-CAP-DEVROOM.md`

Then audit Markroom gaps and implement Phase A.
```

---

## How to use

1. Open **Cap-Markroom** in Cursor.
2. Paste the prompt above (inside the code block).
3. Let the agent read both repos and implement phase by phase.
4. After Markroom is upgraded, run `scripts/sync-portfolio-check.sh` from either repo (once DevRoom adds it) to keep ecosystem config aligned.

## What DevRoom already shipped (this session)

| Capability | DevRoom | Markroom (before upgrade) |
|------------|---------|---------------------------|
| Agent memory in prompts | ✅ SQLite AgentMemory | ✅ (verify parity) |
| Live agent status from jobs | ✅ `/api/agents/status` | ⬜ Add equivalent |
| Server sync for tasks/priorities | ✅ `server-sync.ts` | ⬜ Audit localStorage |
| Health / API banner | ✅ | ✅ (extend) |
| Per-agent workspace + memory UI | ✅ | ⬜ Enhance |
| Investor docs | ✅ ONE-PAGER, WHY, DEVICE | ✅ (add parity doc) |
| DevRoom handoff | N/A | ⬜ Add “Send to DevRoom” |
| Portfolio deliverables scan | ✅ sandboxes | ⬜ Rules-based gaps |

---

*Cap family · DevRoom v3.1.0 → Markroom parity prompt*
