import { BRAND, migrateStorageKeys, storageKey } from "./brand";

export type AgentStatus = "active" | "idle" | "standby";
export type RiskTier = "Low" | "Medium" | "High";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type TaskPriority = "URGENT" | "HIGH" | "NORMAL" | "LOW";
export type TaskStatus = "pending" | "in_progress" | "done";

export interface Task {
  id: string;
  description: string;
  agent: string;
  priority: TaskPriority;
  risk: RiskTier;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export interface Agent {
  codename: string;
  name: string;
  role: string;
  description: string;
  reportsTo: string;
  triggers: string[];
  status: AgentStatus;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "archived";
  openBugs: number;
  createdAt: string;
  stack?: string;
  liveUrl?: string;
}

export interface Approval {
  id: string;
  title: string;
  description: string;
  agent: string;
  projectId?: string;
  risk: RiskTier;
  status: ApprovalStatus;
  createdAt: string;
}

export interface KnowledgeEntry {
  id: string;
  filename: string;
  category: string;
  summary: string;
  updatedAt: string;
}

export interface Priority {
  id: string;
  text: string;
  done: boolean;
}

export const AGENTS: Agent[] = [
  {
    codename: "APEX",
    name: "CEO",
    role: "Chief Executive Officer",
    description:
      "Highest-level strategic thinker. Challenges strategy, forces prioritization, protects long-term vision from short-term noise.",
    reportsTo: "Shamikh Ahmed",
    triggers: [
      "Vision alignment",
      "Strategic decisions",
      "Priority conflicts",
      "Build vs buy",
      "Market direction",
    ],
    status: "active",
  },
  {
    codename: "FORGE",
    name: "CTO",
    role: "Chief Technology Officer",
    description:
      "Owns the architecture, engineering standards, and technical debt backlog. Thinks in systems, not features.",
    reportsTo: "APEX",
    triggers: [
      "Architecture decisions",
      "Tech stack selection",
      "Engineering standards",
      "Technical debt",
      "System design",
    ],
    status: "active",
  },
  {
    codename: "PRISM",
    name: "Product Manager",
    role: "Chief Product Officer",
    description:
      "Bridges user needs and engineering reality. Owns roadmap, backlog, and success metrics.",
    reportsTo: "APEX",
    triggers: [
      "Feature scoping",
      "Roadmap planning",
      "User stories",
      "Success metrics",
      "Backlog prioritization",
    ],
    status: "active",
  },
  {
    codename: "PIXEL",
    name: "Frontend Architect",
    role: "Frontend Architect + UI/UX Lead",
    description:
      "Owns everything the user sees and touches. Thinks in systems — component libraries, design tokens, interaction patterns.",
    reportsTo: "FORGE",
    triggers: [
      "UI component design",
      "Design system",
      "Accessibility",
      "Frontend performance",
      "UX patterns",
    ],
    status: "idle",
  },
  {
    codename: "CORE",
    name: "Backend Architect",
    role: "Backend Architect + Infrastructure Lead",
    description:
      "Owns the server, the data, and the truth. Designs APIs, databases, and observable infrastructure.",
    reportsTo: "FORGE",
    triggers: [
      "API design",
      "Database modeling",
      "Infrastructure setup",
      "Auth systems",
      "Performance tuning",
    ],
    status: "idle",
  },
  {
    codename: "SHIELD",
    name: "QA Engineer",
    role: "Quality Assurance Lead",
    description:
      "Adversarial by design. Breaks things before users do. Does not trust that code works — it verifies.",
    reportsTo: "FORGE",
    triggers: [
      "Test planning",
      "Edge case analysis",
      "Release validation",
      "Regression checks",
      "Quality gates",
    ],
    status: "standby",
  },
  {
    codename: "VAULT",
    name: "Security Officer",
    role: "Chief Security Officer",
    description:
      "Operates under assumption of breach. Models threats, identifies attack surfaces, eliminates vulnerabilities.",
    reportsTo: "FORGE",
    triggers: [
      "Threat modeling",
      "Security audit",
      "Auth review",
      "Dependency scanning",
      "Incident response",
    ],
    status: "standby",
  },
  {
    codename: "LENS",
    name: "Research Agent",
    role: "Chief Research Officer",
    description:
      "Does not speculate. Investigates. Gathers evidence, evaluates sources, compares alternatives, delivers clear recommendations.",
    reportsTo: "APEX",
    triggers: [
      "Technology evaluation",
      "Competitive analysis",
      "Market research",
      "Fact-checking",
      "Due diligence",
    ],
    status: "idle",
  },
  {
    codename: "SCROLL",
    name: "Documentation Agent",
    role: "Chief Knowledge Officer",
    description:
      "Ensures nothing important is ever forgotten and nothing built is ever undiscoverable.",
    reportsTo: "FORGE",
    triggers: [
      "Docs generation",
      "Changelog writing",
      "Knowledge capture",
      "API documentation",
      "Onboarding guides",
    ],
    status: "standby",
  },
  {
    codename: "INK",
    name: "Content Agent",
    role: "Chief Content Officer",
    description:
      "Strategic communicator who understands users, markets, and psychology. Writes copy that converts.",
    reportsTo: "APEX",
    triggers: [
      "Marketing copy",
      "Product narratives",
      "Blog content",
      "Launch messaging",
      "Social content",
    ],
    status: "standby",
  },
  {
    codename: "QUILL",
    name: "Writing Lead",
    role: "Chief Writing Officer",
    description:
      "Long-form writing, editing, product narrative, blog posts. Checks existing copy before duplicating.",
    reportsTo: "APEX",
    triggers: [
      "Writing",
      "Blog drafts",
      "Copy editing",
      "Product story",
      "Tone and voice",
    ],
    status: "idle",
  },
  {
    codename: "SLIDE",
    name: "Presentation Architect",
    role: "Presentation Lead",
    description:
      "Slide decks, keynote structure, demo flows. Scans for existing presentations before creating new ones.",
    reportsTo: "APEX",
    triggers: [
      "Presentations",
      "Slide decks",
      "Keynote",
      "Demo flow",
      "Pitch deck visuals",
    ],
    status: "standby",
  },
  {
    codename: "PITCH",
    name: "Investor Relations",
    role: "Pitch Strategist",
    description:
      "Investor one-pagers, pitch narratives, traction framing. Honest solo-dev positioning.",
    reportsTo: "APEX",
    triggers: [
      "Investor pitch",
      "Fundraising",
      "One-pager",
      "VC deck",
      "Market sizing",
    ],
    status: "idle",
  },
];

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj-000",
    name: "Cap DevRoom",
    description:
      "Personal executive office — AI agents, CEO approvals, sandbox runs, and portfolio command center.",
    status: "active",
    openBugs: 0,
    createdAt: "2026-06-01",
    stack: "Next.js · Tailwind · TypeScript · @cursor/sdk",
    liveUrl: "http://localhost:3000",
  },
  {
    id: "proj-001",
    name: "VaultCap",
    description:
      "Zero-knowledge encrypted life vault — finance, identity, documents across PK/UK/UAE. Capricorn flagship.",
    status: "active",
    openBugs: 0,
    createdAt: "2025-10-01",
    stack: "Vanilla JS · AES-256-GCM · PWA",
    liveUrl: "https://shamikhahmed.github.io/VaultCap/",
  },
  {
    id: "proj-002",
    name: "PulseCap",
    description:
      "Performance OS — 300+ exercises, body map, Smart Coach, recovery readiness. Formerly PulseCap.",
    status: "active",
    openBugs: 0,
    createdAt: "2025-08-15",
    stack: "Vanilla JS · localStorage · PWA",
    liveUrl: "https://shamikhahmed.github.io/PulseCap/",
  },
  {
    id: "proj-003",
    name: "PrismCap",
    description: "38 offline party games. Pass-and-play on one phone. Formerly PrismCap.",
    status: "active",
    openBugs: 0,
    createdAt: "2025-11-20",
    stack: "React · TypeScript · PWA",
    liveUrl: "https://shamikhahmed.github.io/PrismCap/",
  },
  {
    id: "proj-004",
    name: "SteadyCap",
    description: "Recovery OS — score, SOS, medicines, journal. Formerly SteadyCap.",
    status: "active",
    openBugs: 0,
    createdAt: "2026-02-01",
    stack: "Vanilla JS · localStorage · PWA",
    liveUrl: "https://shamikhahmed.github.io/SteadyCap/",
  },
  {
    id: "proj-005",
    name: "LedgerCap",
    description: "Pakistani wealth OS — PSX, Meezan funds, Zakat. Formerly LedgerCap.",
    status: "active",
    openBugs: 0,
    createdAt: "2026-03-15",
    stack: "Vanilla JS · localStorage · PWA",
    liveUrl: "https://shamikhahmed.github.io/LedgerCap/",
  },
  {
    id: "proj-006",
    name: "DeePonyCap",
    description: "Child-safe MLP collector — shelves, wishlist, achievements. Formerly DeePonyCap.",
    status: "active",
    openBugs: 0,
    createdAt: "2025-12-01",
    stack: "Vanilla JS · PWA",
    liveUrl: "https://shamikhahmed.github.io/DeePonyCap/",
  },
  {
    id: "proj-007",
    name: "ScentCap",
    description: "Fragrance wardrobe PWA — advisor, layering lab, calendar, analytics.",
    status: "active",
    openBugs: 0,
    createdAt: "2026-06-01",
    stack: "React · Vite · Tailwind · PWA",
    liveUrl: "https://shamikhahmed.github.io/ScentCap/",
  },
  {
    id: "proj-008",
    name: "AuraCap",
    description: "Apple ecosystem studio — import guide, DNA, layouts. Standalone Cap app.",
    status: "active",
    openBugs: 0,
    createdAt: "2026-06-01",
    stack: "React · Vite · Tailwind · PWA",
    liveUrl: "https://shamikhahmed.github.io/AuraCap/",
  },
  {
    id: "proj-009",
    name: "Capricorn Hub",
    description: "Company marketing site — shamikhahmed.github.io. Eight product pages + sovereignty narrative.",
    status: "active",
    openBugs: 0,
    createdAt: "2026-06-10",
    stack: "Static HTML · capricorn.css",
    liveUrl: "https://shamikhahmed.github.io/",
  },
  {
    id: "proj-010",
    name: "CarApp",
    description: "Vehicle tracking placeholder — deferred, no code yet.",
    status: "paused",
    openBugs: 0,
    createdAt: "2026-04-01",
    stack: "TBD",
  },
];

export const DEFAULT_APPROVALS: Approval[] = [
  {
    id: "apr-001",
    title: "Hub: iPhone hero layout pass on shamikhahmed.github.io",
    description:
      "Tighten mobile hero — no blank space above fold. Bump capricorn.css cache. PIXEL to verify 375/390px.",
    agent: "PIXEL",
    projectId: "Capricorn Hub",
    risk: "Low",
    status: "approved",
    createdAt: "2026-06-11",
  },
  {
    id: "apr-002",
    title: "PulseCap: Playwright smoke on onboarding + workout log",
    description:
      "SHIELD to add or run e2e covering demo mode, equipment setup, and one logged set.",
    agent: "SHIELD",
    projectId: "PulseCap",
    risk: "Low",
    status: "pending",
    createdAt: "2026-06-11",
  },
  {
    id: "apr-003",
    title: "ScentCap + AuraCap: SPA deep-link 404.html on GitHub Pages",
    description:
      "Ensure /ScentCap/onboarding and /AuraCap/import-guide work when bookmarked. FORGE — verify redirect script in dist.",
    agent: "FORGE",
    projectId: "ScentCap",
    risk: "Low",
    status: "approved",
    createdAt: "2026-06-11",
  },
  {
    id: "apr-004",
    title: "Portfolio: frontend-design pass per Cap app",
    description:
      "PIXEL + PITCH: one visual polish session per app (8 apps + hub). Distinct identity per product — no template reuse.",
    agent: "PIXEL",
    projectId: "Capricorn Hub",
    risk: "Medium",
    status: "pending",
    createdAt: "2026-06-12",
  },
  {
    id: "apr-005",
    title: "VaultCap: regenerate distinct hub screenshots 2–8",
    description:
      "Re-run capture-screenshots.mjs if any vaultcap gallery frames are duplicate hashes.",
    agent: "SHIELD",
    projectId: "VaultCap",
    risk: "Low",
    status: "pending",
    createdAt: "2026-06-11",
  },
  {
    id: "apr-006",
    title: "Security audit: VaultCap PIN lockout storage",
    description:
      "VAULT to confirm lockout state cannot be trivially cleared from localStorage on device.",
    agent: "VAULT",
    projectId: "VaultCap",
    risk: "High",
    status: "pending",
    createdAt: "2026-06-06",
  },
];

export const DEFAULT_KNOWLEDGE: KnowledgeEntry[] = [
  // ── Cap DevRoom System ──────────────────────────────────────────────────
  {
    id: "kn-001",
    filename: "agent-capabilities.md",
    category: "Cap DevRoom",
    summary: "Full capability matrix for all 13 agents: APEX (CEO), FORGE (CTO), PRISM (PM), PIXEL (Frontend), CORE (Backend), SHIELD (QA), VAULT (Security), LENS (Research), SCROLL (Docs), QUILL, SLIDE, PITCH, INK (Content). Includes triggers and escalation paths.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-002",
    filename: "risk-framework.md",
    category: "Cap DevRoom",
    summary: "Three-tier risk system. Low: docs, reports, analysis — auto-execute. Medium: features, refactors, DB changes — queue for approval. High: deletions, migrations, rewrites — escalate immediately.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-003",
    filename: "product-principles.md",
    category: "Cap DevRoom",
    summary: "Core operating principles: ship working software over theoretical perfection, measure everything, user value over technical elegance, offline-first where possible, no subscriptions for personal tools.",
    updatedAt: "2026-06-01",
  },
  // ── VaultCap ──────────────────────────────────────────────────────────
  {
    id: "kn-010",
    filename: "vaultcap-architecture.md",
    category: "VaultCap",
    summary: "Zero-knowledge encrypted PWA. AES-256-GCM via Web Crypto API, PBKDF2 key derivation (310k iterations, SHA-256). Single global state S in localStorage['vos3']. Schema v4 with Migrate.run() on boot. IndexedDB for encrypted blobs.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-011",
    filename: "vaultcap-security.md",
    category: "VaultCap",
    summary: "Security model: PIN brute-force lockout (30s → 5min → vault wipe), decoy PIN shows empty vault under duress, no server-side storage ever. PBKDF2 + AES-256-GCM is the full trust chain. Web Crypto API only.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-012",
    filename: "vaultcap-modules.md",
    category: "VaultCap",
    summary: "Module coverage: Banks/cards/investments/loans/cash (PK/UK/UAE), BC committees, zakat calculator, prize bonds, credit scores, IBAN tracking. Identity: passports, NICs, visas, SIMs, driving licences. Assets: property, vehicles (MOT/tax alerts), gadgets. Family vault with linked docs.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-013",
    filename: "vaultcap-stack.md",
    category: "VaultCap",
    summary: "Stack: Vanilla JS, no framework, no npm, no build step. Files: index.html (app shell), js/app.js (~1200 lines, core engine), js/ui.js (~1040 lines, UI modules), css/{base,layout,components,themes}.css. 18 themes. Open python3 -m http.server 8080 to run. Demo PIN: 123456.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-014",
    filename: "vaultcap-ai-features.md",
    category: "VaultCap",
    summary: "Smart Add: describe what to add, Claude AI detects and pre-fills the form. AI Import: paste any text, Claude extracts structured financial data. Live rates: real-time FX (PKR/GBP/AED/USD) and gold/silver prices.",
    updatedAt: "2026-06-06",
  },
  // ── PulseCap Pro ─────────────────────────────────────────────────────
  {
    id: "kn-020",
    filename: "pulsecap-overview.md",
    category: "PulseCap",
    summary: "PulseCap Pro v4 — AI-powered fitness tracking PWA. Live: shamikhahmed.github.io/PulseCap. Built across 14 dev sessions. Features: 300+ exercise database, HIIT/LISS/MISS/SIT/Fartlek protocols, body map, 5 AI coach personalities, nutrition, PR detection, superset mode.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-021",
    filename: "pulsecap-architecture.md",
    category: "PulseCap",
    summary: "Stack constraints (never change): vanilla JS only, no React/frameworks/build tools, pure localStorage via S object, DOMContentLoaded boot, screen system via reg('name', fn), router via go('screenName'). No CSP meta tags. Run node --check on all JS before git commit.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-022",
    filename: "pulsecap-screens.md",
    category: "PulseCap",
    summary: "Screen flow: intro (4 slides) → onboarding (12 steps) → dashboard. Nav hidden during intro/onboarding. Key modules: onboarding, dashboard, workout, bodymap, coach, progress, nutrition, recovery, settings (7 tabs). Key engines: ReadinessEngine.score() (0-100).",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-023",
    filename: "pulsecap-ai-coach.md",
    category: "PulseCap",
    summary: "AI Coach: 5 personalities — Maya (Sports Scientist), Alex (Drill Sergeant), Sam (Motivator), Zen (Mindful), Rex (Powerlifter). 3 tones: Motivational, Scientific, Hardcore. Goal-aware insights for fat loss/strength/hypertrophy/recomp/athletic/maintenance. Deload signals via streak-based fatigue detection.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-024",
    filename: "pulsecap-v2-notes.md",
    category: "PulseCap",
    summary: "PulseCap v2 is a second-generation rewrite with a more modular engine architecture. Separate engine files (workoutEngine.js, nutritionEngine.js, recoveryEngine.js) under js/engines/. Also has js/modules/ and js/ui/ separation. PWA, vanilla JS, localStorage. Status: active development.",
    updatedAt: "2026-06-06",
  },
  // ── PrismCap ───────────────────────────────────────────────────────────
  {
    id: "kn-030",
    filename: "prismcap-overview.md",
    category: "PrismCap",
    summary: "30-game offline gaming platform. Live: shamikhahmed.github.io/PrismCap. Optimised for iPhone PWA, Pass & Play on a single device. No accounts, no internet after first load.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-031",
    filename: "prismcap-games.md",
    category: "PrismCap",
    summary: "Game categories: Social Deception (Shadow Protocol, Spy Hunt, Imposter Frequency, Split Truth, Silent Vote, Heist), Reflex & Speed (Reflex Ladder, Quick Tap, Rhythm Pulse), Strategy (AI Survival, Infinite Maze, Memory Matrix, Decode Signal, Pressure), Party (Chaos Cards, Hot Potato, Truth Bomb), Competitive (Snake, Tournament Mode).",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-032",
    filename: "prismcap-stack.md",
    category: "PrismCap",
    summary: "Stack: React + TypeScript. Has package.json, tsconfig.json, /src directory — the only project in the portfolio using a build system. PWA with manifest.json. Assets in /public. Likely Vite or CRA.",
    updatedAt: "2026-06-06",
  },
  // ── SteadyCap ──────────────────────────────────────────────────────
  {
    id: "kn-040",
    filename: "steadycap-overview.md",
    category: "SteadyCap",
    summary: "Personal Recovery Operating System. Dark theme, orange accent (#FF6B35). PWA with offline support, service worker, manifest. Architecture mirrors PulseCap pattern: app.js + data/ + engines/ + modules/ + ui/ folders. Habit tracking and recovery protocols.",
    updatedAt: "2026-06-06",
  },
  // ── LedgerCap ──────────────────────────────────────────────────────────
  {
    id: "kn-050",
    filename: "stundsOS-overview.md",
    category: "LedgerCap",
    summary: "Personal Wealth Operating System. Dark theme (#0B0E11), orange accent (#FF6B35). PWA. Modular architecture: app.js + data/ + engines/ + modules/ + ui/. Same structural pattern as SteadyCap and PulseCap. Wealth management and financial tracking focus.",
    updatedAt: "2026-06-06",
  },
  // ── DeePonyCap ─────────────────────────────────────────────────────────
  {
    id: "kn-060",
    filename: "ponyvault-overview.md",
    category: "DeePonyCap",
    summary: "Savings and financial tracking app. Minimal card-based UI with light theme. Single-file PWA (index.html + index v6.html prototype). Add Pony flow for savings tracking. Lightweight, no build step.",
    updatedAt: "2026-06-06",
  },
  // ── Project Context Files ─────────────────────────────────────────────
  {
    id: "kn-080",
    filename: "vaultcap.md",
    category: "VaultCap",
    summary: "VaultCap project context file. Schema v13, SW cache vaultcap-v13, ~14,000 lines. Open issues: CSP blocking bank logos (gstatic.com), metals.live SSL fallback needed. Next: fix CSP meta tag, fix metals.live fallback, iPhone testing. Local: ~/Desktop/Projects/VaultCap.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-081",
    filename: "pulsecap.md",
    category: "PulseCap",
    summary: "PulseCap v2 project context. Clean rebuild, 4 tabs: Today · Programs · Progress · You. 2,186 lines, 12 files. Features: 200+ exercises, 7 programs (PPL, 5/3/1, etc.), PR detection, rest timer, heatmap. Issues: no GitHub remote yet, iPhone testing pending, custom program builder incomplete. Local: ~/Desktop/Projects/PulseCap2.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-082",
    filename: "steadycap.md",
    category: "SteadyCap",
    summary: "SteadyCap v2 project context. 22 files, 3,750 lines. 10 habits tracked. Features: Recovery Score (0-100), Emergency SOS, Trigger Intelligence, Craving Forecast, Recovery Journal, Prayer Anchor, Hair Recovery Tracking. Issues: recovery.js screen not built, iPhone testing pending. Local: ~/Desktop/Projects/SteadyCap.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-083",
    filename: "stundsOS.md",
    category: "LedgerCap",
    summary: "LedgerCap project context. V2 ledger-first rebuild. Real holdings pre-loaded: Rafi (22 stocks), AKD (8 stocks), Meezan (7 funds). Bloomberg-style dashboard, Wealth Insights Engine, Financial Freedom tracker. Issues: Yahoo CORS blocked for some symbols, fallback prices not seeding, ENGROH symbol map wrong. Local: ~/Desktop/Projects/LedgerCap.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-084",
    filename: "prismcap.md",
    category: "PrismCap",
    summary: "PrismCap project context. 38 games, Pass & Play, iPhone/iPad optimised, single HTML file. Features: friends rivalry tracking, gender/age themes, Web Audio API music, Dynamic Island safe area support. Open: 1 bug. Next: add more games, test latest iPhone models. Local: ~/Desktop/Projects/PrismCap.",
    updatedAt: "2026-06-06",
  },
  // ── Cross-Project Patterns ─────────────────────────────────────────────
  {
    id: "kn-070",
    filename: "portfolio-patterns.md",
    category: "Engineering",
    summary: "Common patterns across Shamikh's PWA portfolio: (1) Vanilla JS preferred over frameworks for personal tools, (2) Single global S object in localStorage, (3) No CDNs, no backends, fully offline-first, (4) Orange (#FF6B35) as brand accent across SteadyCap/LedgerCap/PulseCap, (5) reg(name, fn) screen system + go(name) router used across multiple projects.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-071",
    filename: "portfolio-live-urls.md",
    category: "Engineering",
    summary: "Live deployments: PulseCap Pro → shamikhahmed.github.io/PulseCap | VaultCap → shamikhahmed.github.io/VaultCap | PrismCap → shamikhahmed.github.io/PrismCap. All hosted on GitHub Pages. Owner: Shamikh Ahmed, Karachi PK.",
    updatedAt: "2026-06-06",
  },
  {
    id: "kn-072",
    filename: "portfolio-security-posture.md",
    category: "Security",
    summary: "Security patterns: VaultCap uses AES-256-GCM + PBKDF2 (gold standard for client-side). PulseCap uses plain localStorage (no sensitive data). VaultCap has decoy PIN and brute-force lockout. No project uses a backend or sends data off-device. Web Crypto API is the only trust primitive.",
    updatedAt: "2026-06-06",
  },
];

export const DEFAULT_PRIORITIES: Priority[] = [
  { id: "p1", text: "Complete Cap DevRoom → move into Desktop/Projects (like Cap-Markroom)", done: false },
  { id: "p2", text: "VAULT: review VaultCap PIN lockout storage", done: false },
  { id: "p3", text: "PIXEL: frontend-design pass — 8 Cap apps + hub", done: false },
  { id: "p4", text: "SHIELD: Playwright coverage on PulseCap + ScentCap", done: false },
  { id: "p5", text: "CarApp: keep paused until core 8 are maintenance-stable", done: true },
];

export const APEX_RECOMMENDATION =
  "Eight Cap apps are investor-ready on the hub. Cap DevRoom maintains them via sandboxes; Cap-Markroom handles outward marketing. Wire CURSOR_API_KEY, sync sandboxes weekly. CarApp stays paused.";

const DATA_VERSION = "6";

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — reads still fall back to defaults */
  }
}

function parseArray<T>(raw: string | null, fallback: T[]): T[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
    return parsed as T[];
  } catch {
    return fallback;
  }
}

function seedAllDefaults() {
  safeSetItem(storageKey("projects"), JSON.stringify(DEFAULT_PROJECTS));
  safeSetItem(storageKey("approvals"), JSON.stringify(DEFAULT_APPROVALS));
  safeSetItem(storageKey("knowledge"), JSON.stringify(DEFAULT_KNOWLEDGE));
  safeSetItem(storageKey("priorities"), JSON.stringify(DEFAULT_PRIORITIES));
  safeSetItem(storageKey("tasks"), JSON.stringify([]));
  safeSetItem(storageKey("data_version"), DATA_VERSION);
}

export function resetPortfolioData() {
  if (typeof window === "undefined") return;
  seedAllDefaults();
}

export function initStorage() {
  if (typeof window === "undefined") return;
  migrateStorageKeys();
  const version = safeGetItem(storageKey("data_version"));
  if (version !== DATA_VERSION) {
    seedAllDefaults();
    return;
  }
  const projects = safeGetItem(storageKey("projects"));
  const approvals = safeGetItem(storageKey("approvals"));
  const knowledge = safeGetItem(storageKey("knowledge"));
  if (!projects || projects === "[]") safeSetItem(storageKey("projects"), JSON.stringify(DEFAULT_PROJECTS));
  if (!approvals || approvals === "[]") safeSetItem(storageKey("approvals"), JSON.stringify(DEFAULT_APPROVALS));
  if (!knowledge || knowledge === "[]") safeSetItem(storageKey("knowledge"), JSON.stringify(DEFAULT_KNOWLEDGE));
  if (!safeGetItem(storageKey("priorities"))) safeSetItem(storageKey("priorities"), JSON.stringify(DEFAULT_PRIORITIES));
  if (!safeGetItem(storageKey("tasks"))) safeSetItem(storageKey("tasks"), JSON.stringify([]));
}

export function computePortfolioMetrics() {
  const projects = getProjects();
  const approvals = getApprovals();
  const tasks = getTasks();
  const knowledge = getKnowledge();
  const activeProjects = projects.filter((p) => p.status === "active");
  return {
    activeProjects: activeProjects.length,
    openBugs: projects.reduce((s, p) => s + p.openBugs, 0),
    pendingApprovals: approvals.filter((a) => a.status === "pending").length,
    activeAgents: AGENTS.filter((a) => a.status === "active").length,
    tasksPending: tasks.filter((t) => t.status !== "done").length,
    knowledgeDocs: knowledge.length,
    optimal: activeProjects.filter((p) => p.openBugs === 0).length,
    degraded: activeProjects.filter((p) => p.openBugs >= 3).length,
  };
}

export function getTasks(): Task[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(storageKey("tasks"));
  return raw ? JSON.parse(raw) : [];
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(storageKey("tasks"), JSON.stringify(tasks));
}

export function getProjects(): Project[] {
  if (typeof window === "undefined") return DEFAULT_PROJECTS;
  return parseArray(safeGetItem(storageKey("projects")), DEFAULT_PROJECTS);
}

export function saveProjects(projects: Project[]) {
  localStorage.setItem(storageKey("projects"), JSON.stringify(projects));
}

export function getApprovals(): Approval[] {
  if (typeof window === "undefined") return DEFAULT_APPROVALS;
  return parseArray(safeGetItem(storageKey("approvals")), DEFAULT_APPROVALS);
}

export function saveApprovals(approvals: Approval[]) {
  localStorage.setItem(storageKey("approvals"), JSON.stringify(approvals));
}

export function getKnowledge(): KnowledgeEntry[] {
  if (typeof window === "undefined") return DEFAULT_KNOWLEDGE;
  return parseArray(safeGetItem(storageKey("knowledge")), DEFAULT_KNOWLEDGE);
}

export function getPriorities(): Priority[] {
  if (typeof window === "undefined") return DEFAULT_PRIORITIES;
  const raw = localStorage.getItem(storageKey("priorities"));
  return raw ? JSON.parse(raw) : DEFAULT_PRIORITIES;
}

export function savePriorities(priorities: Priority[]) {
  localStorage.setItem(storageKey("priorities"), JSON.stringify(priorities));
}
