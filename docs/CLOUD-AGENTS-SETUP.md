# Cap DevRoom — Cloud Agents setup

1. Create **CURSOR_API_KEY** at [cursor.com/dashboard/integrations](https://cursor.com/dashboard/integrations)
2. Connect **GitHub** (shamikhahmed/* repos)
3. Default repo: `shamikhahmed/VaultCap` (or any Cap app)
4. Branch prefix: `capdevroom/`
5. Copy key to `dashboard/.env.local`

## Two modes

| Mode | API | Writes to |
|------|-----|-----------|
| **Local** | `/api/agent/run` | `sandboxes/{App}/` only |
| **Cloud** | `/api/agent/cloud` | GitHub repo (creates branch/PR) |

Leave **Background Agents (self-hosted)** disabled unless you run your own workers.

## Mapped repos

All 8 Cap apps in `lib/devroom/cloud.ts` — keys match `VaultCap`, `PulseCap`, etc.

## Slack / WhatsApp

Optional `WHATSAPP_WEBHOOK_URL` in `.env.local` for critical approval notifications.
