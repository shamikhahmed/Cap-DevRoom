# Cap DevRoom — smoke test checklist

**Cap · DevRoom · v3.1.0** — ~10 minutes manual verification after changes.

---

## Preflight

```bash
cd ~/Desktop/Cap-DevRoom
npm install
npm run rebuild:packages
npm run db:push
npm run doctor
```

Expected: shared dist present, 8 sandboxes, env file noted.

---

## Dashboard boot

```bash
npm run dev:stack
```

Open [http://localhost:3000](http://localhost:3000)

| Check | Expected |
|-------|----------|
| Header brand | **Cap · DevRoom** |
| Sidebar version | v3.1.0 |
| Health API | `GET /api/health` → `version: "3.1.0"`, `cursorApi` status |
| Theme toggle | Settings → Light / Dark / System |
| Agent salaries | `/agents` shows token totals per codename |
| Activity log | Real entries from `data/activity.json` or demo fallback |

---

## Command center

| Page | Check |
|------|-------|
| `/` | Metrics load, CEO command input visible, agent grid renders 13 agents |
| `/briefing` | Priorities checklist, generate briefing works |
| `/projects` | 8 Cap apps + Cap DevRoom + CarApp (paused) |
| `/agents` | All agents including **CORE**; project picker lists 8 Cap apps |
| `/approvals` | Server-side queue loads; approve/reject updates |
| `/tasks` | Kanban board CRUD |
| `/knowledge` | Search filters entries |
| `/deliverables` | Scans sandboxes for README/pitch/presentation |
| `/settings` | Diagnostics, health, network info |

---

## Agent runs (requires `CURSOR_API_KEY`)

1. **Settings** → confirm Cursor API configured
2. **Agents** → select SHIELD, project VaultCap, run local agent with a low-risk task
3. Confirm activity log updates after run
4. **CEO Command** → type "Audit PulseCap UI typography" → APEX delegates to PIXEL

Medium/High risk tasks should appear in **Approvals** before execution.

---

## Sandboxes

```bash
npm run sync:sandboxes
```

Confirm `sandboxes/{VaultCap,...AuraCap}` updated from `~/Desktop/Projects/`.

---

## Build

```bash
npm run build
```

Expected: turbo builds `@cap/devroom-shared` then dashboard with no errors.

---

## Version sync

When bumping version, update:

| File | Field |
|------|-------|
| `package.json` (root) | `version` |
| `packages/shared/package.json` | `version` |
| `packages/shared/src/brand.ts` | `APP_VERSION` |
| `dashboard/package.json` | `version` |
| `README.md` | version table |
| Sidebar | reads `BRAND.version` via shared package |
