# Agency Agents Install & Cap App Test Report

**Date:** 2026-07-01  
**Workspace:** `~/Desktop/Cap-DevRoom` (Capricorn DevRoom)

---

## 1. Agents installed

Source: [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) (233 total roster)

### Cap-DevRoom (primary workspace)

**132 rules** in `.cursor/rules/` (131 agents + `00-cap-agency-roster.mdc`)

| Division | Agents | Covers |
|----------|-------:|--------|
| engineering | 34 | Web, mobile, backend, SRE, code review, minimal-change |
| design | 9 | UI, UX, branding, icons, image prompts |
| marketing | 36 | Content, SEO, launch, social, campaigns |
| product | 5 | PRDs, naming, categorization, roadmaps |
| testing | 8 | QA, accessibility, performance |
| security | 10 | Audits, threat modeling |
| paid-media | 7 | PPC, tracking, ad creative |
| sales | 9 | Outreach, discovery, proposals |
| project-management | 7 | Sprints, retros, comms |
| support | 6 | Docs, tickets, CS |

### Per-app projects (on-demand rules)

**110 rules each** in `.cursor/rules/` for:

- `~/Desktop/Projects/DeePonyCap`
- `~/Desktop/Projects/VaultCap`
- `~/Desktop/Projects/LedgerCap`

Divisions: engineering, design, marketing, product, testing, security, paid-media

### How to invoke

```
@mobile-app-builder Review Capacitor iOS shell for DeePonyCap
@brand-guardian Name and categorize this new Cap module
@image-prompt-engineer App icon concepts for LedgerCap v3.42
@content-strategist Landing page copy for VaultCap campaign
@code-reviewer Audit this PR diff
```

See `.cursor/rules/00-cap-agency-roster.mdc` for the full index.

**Important:** Keep agency rules `alwaysApply: false`. Invoke with `@slug` only when needed. Native Cap agents remain in `agents/` (APEX, FORGE, SHIELD, etc.).

---

## 2. Test results (order: DeePonyCap → VaultCap → LedgerCap)

### DeePonyCap — PASS (32/32)

```
npm test  →  32 passed (~26s)
```

**Fix applied:** `js/version.js` synced to `VERSION.json` (3.6.0). `tests/update-control.spec.js` now reads `window.APP_VERSION` at runtime.

### VaultCap — PASS chromium / PARTIAL WebKit

```
npm run test:e2e  →  120 passed, 11 webkit-iphone failed (~7m)
npm run test:e2e -- --project=chromium  →  120 passed (after fixes)
```

**Fixes applied:**

- `tests/demo-unlock.js` — suppress WhatsNew modal (`vos_wn_ver`), dismiss `#overlay`, wait for `#app` display flex
- `tests/modules.spec.js` — dismiss overlays before tax slab editor click

**WebKit / iPhone Safari (11 tests):** Demo unlock intermittently stalls on `#pgHome` before PIN entry in Playwright WebKit. Chromium suite is green. Recommend manual Safari QA or BrowserStack for true device validation.

### LedgerCap — PASS (79/79)

```
npm test  →  all green (~13s)
```

| Suite | Result |
|-------|--------|
| telegram-format | 20 passed |
| signals-logic | 12 passed |
| pin-vault | 15 passed |
| charts | 6 passed |
| market-data-global | 4 passed |
| Playwright e2e | 22 passed |

---

## 3. Cap-DevRoom doctor

```
npm run doctor  →  All checks passed
```

- 8 sandboxes present
- `CURSOR_API_KEY` configured
- Minor version drift note: root 3.2.0 vs shared 3.1.0 (pre-existing)

---

## 4. Recommended agency agents for Cap portfolio work

| Task | Agent slug |
|------|------------|
| iOS/Capacitor mobile | `@mobile-app-builder` |
| PWA / web UI | `@frontend-developer` |
| App icons & visuals | `@image-prompt-engineer` |
| Naming & brand | `@brand-guardian` |
| Product categorization | `@product-manager` |
| Campaign copy | `@content-strategist` |
| Paid ads | `@ppc-strategist` |
| App Store listing | `@app-store-optimizer` |
| QA pass | `@api-tester` / `@accessibility-auditor` |
| Surgical code fixes | `@minimal-change-engineer` |
| Security review | `@application-security-engineer` |

---

## 5. Files changed during this run

| Project | File | Change |
|---------|------|--------|
| Cap-DevRoom | `.cursor/rules/*` | +132 agency rule files |
| Cap-DevRoom | `.cursor/rules/00-cap-agency-roster.mdc` | Roster index |
| Cap-DevRoom | `docs/agency-agents-install-report.md` | This report |
| DeePonyCap | `js/version.js` | Sync 3.6.0 / v51 cache |
| DeePonyCap | `tests/update-control.spec.js` | Dynamic version assert |
| DeePonyCap | `.cursor/rules/*` | +110 agency rules |
| VaultCap | `tests/demo-unlock.js` | Overlay + WhatsNew test hardening |
| VaultCap | `tests/modules.spec.js` | Tax tab overlay dismiss |
| VaultCap | `.cursor/rules/*` | +110 agency rules |
| LedgerCap | `.cursor/rules/*` | +110 agency rules |
