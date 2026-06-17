# Cap · DevRoom — Device Guide

Use Cap · DevRoom on **iPhone**, **iPad**, and **MacBook** — plus install it as a **PWA** on iOS for app-like access.

**Version:** 3.1.0

---

## iPhone

### Cap DevRoom Mobile app (recommended)

Native companion app in `mobile/` — connects to your Mac over Wi‑Fi.

```bash
cd ~/Desktop/Cap-DevRoom/mobile
npm install
npx expo start
```

Configure **Settings → Server URL** with your Mac LAN IP from the dashboard Settings page.

### Browser (Safari)

1. Open your DevRoom URL (e.g. `http://localhost:3000` in dev, or your Render domain).
2. Use **Command center** for overview; **Approvals** for quick reviews; **Briefing** for morning standup.

**Tips**

- Add to Home Screen (below) for fullscreen standalone mode.
- Portrait works best for approvals; landscape for agent roster + activity log.

### Install PWA on iPhone

1. Open the site in **Safari**.
2. Tap **Share** (square with arrow).
3. Tap **Add to Home Screen**.
4. Name it **DevRoom**.
5. Tap **Add**.

The app opens without Safari chrome. Service worker caches the shell for faster repeat loads.

---

## iPad

Same steps as iPhone. Wider breakpoints show:

- Side-by-side metrics and agent grid
- Full activity log beside roster on landscape

---

## MacBook

1. Open `http://localhost:3000` (or production URL).
2. Recommended: run `npm run dev:stack` from Cap-DevRoom root so dashboard + DB are ready.
3. Use **Agents → OPEN WORKSPACE** for per-agent sandbox runs.

**Chrome / Safari / Edge** all work. For agent runs, ensure `CURSOR_API_KEY` is set server-side in `dashboard/.env.local`.

---

## Health & offline

- **ApiStatusBanner** appears if SQLite or `CURSOR_API_KEY` is missing — follow on-screen fix steps.
- **Offline:** cached shell loads; agent runs and API writes require network + local server.

---

## Pair with Markroom

- **DevRoom** = engineering office (build, security, QA, architecture)  
- **Markroom** = marketing office (content, SEO, strategy)  

Use both PWAs on the same device — separate home screen icons.

---

*Cap · DevRoom · Cap family*
