# Cap suite — DevRoom + Markroom

| Product | Folder | Purpose |
|---------|--------|---------|
| **Cap DevRoom** | `Cap-DevRoom` | AI agents maintain 8 Cap PWAs (engineering office) |
| **Cap Markroom** | `Cap-Markroom` | Marketing, content, company ops (Turborepo SaaS) |
| **Capricorn Hub** | `shamikhahmed.github.io` | Public investor site |

## Workflow

1. **Cap DevRoom** — PIXEL/SHIELD/FORGE run on sandboxes; CEO approves medium/high risk
2. **Cap Markroom** — blog, LinkedIn, SEO agents for company narrative
3. **Production** — merge sandbox work manually or via Cloud Agent PRs to GitHub

## Shared portfolio config

Cap DevRoom: `packages/shared/src/capricorn-ecosystem.ts`  
Cap Markroom: `packages/shared/src/capricorn-ecosystem.ts`

Keep both in sync when adding a 9th app. DevRoom adds `githubRepo`, `stack`, and `legacyIds` for engineering sandboxes.
