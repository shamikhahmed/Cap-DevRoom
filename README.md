# Cap · DevRoom

**Cap family · AI development office · v3.1.0**

Your AI development office for the eight Cap apps. CEO agent (APEX) delegates to specialists; agents work in **sandbox copies** only — never your live `Desktop/Projects` repos.

Formerly JARVIS OS → Meridian Office → **Cap DevRoom** (June 2026).

| | |
|---|---|
| **Location** | `~/Desktop/Cap-DevRoom` |
| **Package** | `cap-devroom` |
| **Dashboard** | Next.js 16 · `@cap/devroom-dashboard` |
| **Sibling** | [Cap-Markroom](~/Desktop/Cap-Markroom) — marketing & company ops |

---

## Quick start

```bash
cd ~/Desktop/Cap-DevRoom

npm install
npm run rebuild:packages
npm run db:push

# 1. API key
cp dashboard/.env.example dashboard/.env.local
# Edit: CURSOR_API_KEY=...  DEVROOM_API_TOKEN=... (for iPhone/LAN)

# 2. Sync sandbox copies from live Cap apps
npm run sync:sandboxes

# 3. Run dashboard
npm run dev:stack
# → http://localhost:3000
```

---

## Architecture (Markroom-aligned)

```
Cap-DevRoom/
├── packages/shared/     @cap/devroom-shared — portfolio, agent org, brand
├── dashboard/           @cap/devroom-dashboard — Next.js UI + API routes
├── agents/              Markdown role specs (reference)
├── sandboxes/           Rsync copies of 8 Cap apps
├── scripts/             dev-stack, doctor, sync-sandboxes
└── data/                SQLite (devroom.db) + legacy JSON migration source
```

Turborepo orchestrates builds across workspaces. Portfolio config lives in **one place** (`packages/shared`) — keep in sync with Cap-Markroom's `capricorn-ecosystem.ts`.

---

## Portfolio (8 Cap apps)

| App | Role | Live |
|-----|------|------|
| VaultCap | Encrypted life vault | [VaultCap](https://shamikhahmed.github.io/VaultCap/) |
| PulseCap | Performance OS | [PulseCap](https://shamikhahmed.github.io/PulseCap/) |
| PrismCap | 38 party games | [PrismCap](https://shamikhahmed.github.io/PrismCap/) |
| SteadyCap | Recovery OS | [SteadyCap](https://shamikhahmed.github.io/SteadyCap/) |
| LedgerCap | Wealth OS | [LedgerCap](https://shamikhahmed.github.io/LedgerCap/) |
| DeePonyCap | MLP collector | [DeePonyCap](https://shamikhahmed.github.io/DeePonyCap/) |
| ScentCap | Fragrance wardrobe | [ScentCap](https://shamikhahmed.github.io/ScentCap/) |
| AuraCap | Apple ecosystem studio | [AuraCap](https://shamikhahmed.github.io/AuraCap/) |

Hub: [shamikhahmed.github.io](https://shamikhahmed.github.io)

---

## Agents

APEX (CEO) · FORGE (CTO) · PRISM (PM) · PIXEL (UI) · **CORE** (Backend) · SHIELD (QA) · SCROLL (docs) · QUILL · SLIDE · PITCH · VAULT · LENS · INK

CEO command → assigns tasks → **Local** (sandbox + Cursor SDK) or **Cloud** (GitHub repo agents).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev:stack` | Build shared packages + dashboard on :3000 |
| `npm run dev` | Turbo dev (all workspaces) |
| `npm run build` | Production build |
| `npm run doctor` | Preflight: env, packages, sandboxes, health |
| `npm run sync:sandboxes` | Copy 8 Cap apps → `sandboxes/` |
| `npm run rebuild:packages` | Force rebuild `@cap/devroom-shared` |
| `npm run dev:mobile` | Expo companion app (`mobile/`) |
| `npm run type-check` | TypeScript across workspaces |

## Mobile app

Native iPhone/Android companion — see [`mobile/README.md`](mobile/README.md).

```bash
npm run dev:mobile
```

Configure the Mac LAN URL in the app Settings tab (same Wi‑Fi as your Mac).

See [TESTING.md](TESTING.md) for smoke test checklist.

---

## Version sync

| File | Version |
|------|---------|
| `package.json` (root) | 3.1.0 |
| `packages/shared/package.json` | 3.1.0 |
| `packages/shared/src/brand.ts` → `APP_VERSION` | 3.1.0 |
| `dashboard/package.json` | 3.1.0 |
| `/api/health` response | 3.1.0 |
| `layout.tsx` meta `cap-devroom-version` | 3.1.0 |
| `public/sw.js` cache name | 3.1.0 |

When bumping version, update all rows above plus this README and `TESTING.md`.

---

## Env vars (`dashboard/.env.local`)

```
CURSOR_API_KEY=
DEVROOM_ROOT=/Users/you/Desktop/Cap-DevRoom
DEVROOM_SANDBOX_ROOT=.../sandboxes
DEVROOM_PROJECTS_ROOT=.../Desktop/Projects
DEVROOM_DEFAULT_REPO=https://github.com/shamikhahmed/VaultCap
```

---

## Cap-Markroom vs Cap DevRoom

| | Cap-Markroom | Cap DevRoom |
|---|--------------|-------------|
| Purpose | Marketing, content, company SaaS | Engineering agents, QA, portfolio maintenance |
| Stack | Turborepo · Nest API · Prisma | Turborepo · Next.js · Cursor SDK |
| Data | Postgres | JSON + localStorage |
| Shared | `@cap/markroom-shared` | `@cap/devroom-shared` |

See `docs/CAP-SUITE.md` for the full picture.
