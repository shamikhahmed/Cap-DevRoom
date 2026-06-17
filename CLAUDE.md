# Cap DevRoom — Claude context

**Version:** 3.1.0 · **Package:** `cap-devroom` · **UI:** Cap · DevRoom

## What this is

Personal AI development office for Shamikh Ahmed's Cap portfolio. Agents are markdown-defined employees; the dashboard orchestrates Cursor SDK runs against **sandbox copies** under `sandboxes/`.

**Never modify** `~/Desktop/Projects/{VaultCap,...}` directly from agents — only sandboxes.

## Folder layout

```
Cap-DevRoom/                 # ~/Desktop/Cap-DevRoom
├── packages/shared/         @cap/devroom-shared
├── packages/database/       Prisma + SQLite
├── dashboard/               Next.js UI + API routes
├── agents/                  Markdown role specs
├── docs/portfolio-context/  Per-app agent context
├── sandboxes/               Rsync copies of 8 Cap apps
├── scripts/                 sync-sandboxes, doctor, dev-stack
├── data/                    devroom.db
└── docs/                    HANDOVER, SETUP, etc.
```

## Agent roster

| Codename | Role |
|----------|------|
| APEX | CEO — delegation only |
| FORGE | CTO |
| PRISM | Product |
| PIXEL | UI/UX |
| SHIELD | QA |
| SCROLL | Docs |
| QUILL | Writing |
| SLIDE | Presentations |
| PITCH | Investor |
| VAULT | Security |
| LENS | Research |
| INK | Content |

## Risk tiers

- **Low** — docs, reports → auto-run
- **Medium/High** — features, migrations → CEO approval queue

## Portfolio IDs

Use Cap names: `VaultCap`, `PulseCap`, `PrismCap`, `SteadyCap`, `LedgerCap`, `DeePonyCap`, `ScentCap`, `AuraCap`.

Legacy `*OS` ids are normalized via `lib/devroom/portfolio.ts`.

## Commands

```bash
npm run sync:sandboxes
npm run dev
npm run doctor
```

## Related

- **Cap-Markroom** — `~/Desktop/Projects/Cap-Markroom` (marketing monorepo)
- **Hub** — `shamikhahmed.github.io`
