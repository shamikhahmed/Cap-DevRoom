# Cap · DevRoom Mobile

Native companion app for **Cap · DevRoom** — connects directly to your Mac dashboard over Wi‑Fi.

**Version:** 1.0.0 · **Requires:** DevRoom dashboard v3.1.0+

## Features

- **Command Center** — health metrics, CEO command to APEX, today’s priorities
- **Approvals** — approve or reject agent runs from your phone
- **Agents** — live roster with token salaries
- **Settings** — configure Mac LAN URL + optional `DEVROOM_API_TOKEN`

## Setup

**Install from the repo root** (mobile is an npm workspace — do not run `npm install` inside `mobile/` alone).

1. On your Mac, run DevRoom:

   ```bash
   cd ~/Desktop/Cap-DevRoom
   npm install
   npm run dev:stack
   ```

2. Note the LAN URL from **Settings → Run on iPhone** (e.g. `http://192.168.18.72:3000`).

3. Start the mobile app (new terminal):

   ```bash
   cd ~/Desktop/Cap-DevRoom
   npm run dev:mobile
   ```

   Or from `mobile/` after root install:

   ```bash
   cd ~/Desktop/Cap-DevRoom/mobile
   npx expo start
   ```

4. Scan the QR code with **Expo Go** (iOS/Android) or press `i` for iOS Simulator.

5. In the app **Settings** tab, paste your Mac’s LAN URL and API token if configured.

## API connection

The app calls the same REST routes as the dashboard:

| Route | Use |
|-------|-----|
| `GET /api/health` | Connection test, metrics |
| `GET /api/approvals` | Pending queue |
| `PATCH /api/approvals` | Approve / reject |
| `GET /api/agents/roster` | Agent salaries |
| `GET /api/priorities` | Briefing priorities |
| `POST /api/ceo/command` | Delegate to APEX |
| `GET /api/network` | Discover LAN URL |

Auth header: `x-devroom-token` when `DEVROOM_API_TOKEN` is set on the server.

## Build for device

```bash
cd ~/Desktop/Cap-DevRoom/mobile
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

---

*Cap · DevRoom · Cap family*
