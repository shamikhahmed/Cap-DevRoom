# Cap · DevRoom — Why It Matters

**Version 3.1.0 · Cap family · Virtual engineering office**

---

## The thesis

Every founder builds products. Few run a structured engineering office. Cap · DevRoom closes that gap with a **local virtual engineering command center** — specialized Smart Assistant agents, sandbox safety, a founder approval pipeline, and portfolio-native context in one production workspace.

This is not a generic chatbot wrapper. It is structured engineering operations: agents propose in sandboxes, founders approve risky work, deliverables get scanned, activity is logged.

---

## Why it is ahead of its time

### 1. Sandboxes before speed

Most “AI coding” tools optimize for direct repo access. Cap · DevRoom inverts that: **agents work in rsync copies** under `sandboxes/`. Production paths are blocked. You get leverage without accidental production damage.

### 2. An org chart, not a chat box

Real engineering teams have roles. DevRoom mirrors that with 13 codename agents — APEX (CEO), FORGE (CTO), VAULT (Security), SHIELD (QA), and more — coordinated through SQLite-backed state and the Cursor SDK.

### 3. Portfolio-native by design

DevRoom knows your Cap apps (VaultCap, PulseCap, PrismCap, …). Deliverables scans, project sandboxes, and agent prompts are grounded in your actual portfolio — not generic templates.

### 4. Honest positioning

Where logic is rules-based or workflow-driven, we say **Smart Assistant**. Where Cursor SDK agents run, we describe them accurately. No fake AI hype.

---

## Who it is for

| Segment | Value |
|---------|-------|
| **Founders & CEOs** | Morning briefing, CEO command, approval inbox |
| **Solo builders** | Multi-agent leverage without hiring |
| **Cap portfolio operators** | Sandboxed work across 8+ apps |
| **Investors evaluating Cap family** | Engineering office layer paired with Markroom (marketing office) |

---

## Stack & reliability

- **Dashboard:** Next.js (`dashboard/`) — dark ops UI, responsive, installable PWA  
- **Data:** Prisma + SQLite at `data/devroom.db` — approvals, tasks, jobs, memory, activity  
- **Agents:** Cursor SDK local runs in sandboxes  
- **Deploy:** Render blueprint (`render.yaml`) when you choose to ship  

Built for reliability first: health banner, server sync, offline shell caching, semantic HTML.

---

## The moat

1. **Sandbox safety** — trust for production-adjacent work  
2. **Token-smart agent memory** — sustainable context per codename  
3. **Portfolio-native agents** — not generic dev assistants  
4. **Cap family ecosystem** — DevRoom as the engineering office; Markroom as marketing  

---

## Call to action

Open DevRoom: `npm run dev:stack`, sync sandboxes, route your first agent task through approvals, generate a morning briefing.

**Cap · DevRoom** — your virtual engineering office.
