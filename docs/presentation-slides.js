/** Cap · DevRoom pitch slide content — loaded by PRESENTATION-v3.1.0.html */
window.CAP_DEVROOM_SLIDES = (function () {
  const IMG = "verification-screenshots/";
  const MOB = IMG + "mobile/";

  return [
    {
      ch: "01",
      title: "Opening",
      theme: "gold",
      note: "Open with conviction: Cap · DevRoom is structured engineering operations — not another chatbot. A solo founder running eight production apps needs an executive office.",
      html: `
        <p class="rv eyebrow">Capricorn Systems · Investor Brief · June 2026</p>
        <h1 class="rv hero-title split-target">Cap · DevRoom</h1>
        <p class="rv lead center">The <strong>virtual engineering office</strong> for the Cap portfolio. Thirteen specialist agents. Sandbox-only execution. Founder approval pipeline. Native mobile companion. <strong>v3.1.0</strong> shipping now.</p>
        <div class="rv stat-grid">
          <div class="stat-card magnetic"><span class="stat-num" data-count="13">0</span><span class="stat-lbl">Codename agents</span></div>
          <div class="stat-card magnetic"><span class="stat-num" data-count="8">0</span><span class="stat-lbl">Cap PWAs live</span></div>
          <div class="stat-card magnetic"><span class="stat-num" data-count="11">0</span><span class="stat-lbl">Projects tracked</span></div>
          <div class="stat-card magnetic"><span class="stat-num">3.1</span><span class="stat-lbl">Production release</span></div>
        </div>
        <p class="rv meta center">Shamikh Ahmed · Capricorn Systems · github.com/shamikhahmed/Cap-DevRoom</p>`,
    },
    {
      ch: "02",
      title: "Thesis",
      theme: "violet",
      note: "Pause on the quote. The gap is not code generation — it is operational structure: delegation, risk gates, memory.",
      html: `
        <p class="rv eyebrow">Chapter 02 · Thesis</p>
        <blockquote class="rv pull-quote">Every founder builds products.<br>Few run a <em>structured engineering office.</em></blockquote>
        <p class="rv body center">Cap · DevRoom closes that gap with a local command center. Smart Assistant agents propose work in isolated sandboxes. The founder approves risky changes. Deliverables are scanned. Every run logs token cost.</p>
        <p class="rv caption center">Not a generic chat wrapper — portfolio-native engineering operations.</p>`,
    },
    {
      ch: "03",
      title: "Portfolio",
      theme: "cyan",
      note: "Eight apps on shamikhahmed.github.io. VaultCap is the Capricorn flagship. Each app has distinct stack and debt profile.",
      html: `
        <p class="rv eyebrow">Chapter 03 · Cap portfolio</p>
        <h2 class="rv split-target">Eight apps.<br>One founder.</h2>
        <p class="rv body center">VaultCap · PulseCap · PrismCap · SteadyCap · LedgerCap · DeePonyCap · ScentCap · AuraCap — investor-ready on the hub.</p>
        <div class="rv bar-chart">
          <div class="bar-item"><span>Production PWAs</span><div class="bar-track"><div class="bar-fill" data-w="100"></div></div><span class="bar-val">8/8</span></div>
          <div class="bar-item"><span>Sandbox sync</span><div class="bar-track"><div class="bar-fill" data-w="100"></div></div><span class="bar-val">Fresh</span></div>
          <div class="bar-item"><span>Hub pages</span><div class="bar-track"><div class="bar-fill" data-w="92"></div></div><span class="bar-val">Live</span></div>
          <div class="bar-item"><span>Investor decks</span><div class="bar-track"><div class="bar-fill" data-w="88"></div></div><span class="bar-val">Per app</span></div>
        </div>`,
    },
    {
      ch: "04",
      title: "Problem",
      theme: "red",
      note: "Three structural pains. Emphasize that ungoverned AI on production repos is unacceptable at portfolio scale.",
      html: `
        <p class="rv eyebrow">Chapter 04 · Problem</p>
        <h2 class="rv split-target">Speed without safety<br>fails at scale.</h2>
        <div class="rv card-grid three">
          <article class="glass-card magnetic"><span class="card-num">01</span><h3>Context fragmentation</h3><p>VaultCap: vanilla JS + Web Crypto. PulseCap: five coach modes. PrismCap: React + TypeScript. Different debt, docs, and release cadence per app.</p></article>
          <article class="glass-card magnetic"><span class="card-num">02</span><h3>Ungoverned AI coding</h3><p>Tools that write directly to production repos create regression risk, secret exposure, and zero audit trail.</p></article>
          <article class="glass-card magnetic"><span class="card-num">03</span><h3>No executive layer</h3><p>Ad-hoc prompts don't delegate, prioritize, or gate risk. Medium and high-impact work needs CEO approval.</p></article>
        </div>`,
    },
    {
      ch: "05",
      title: "Solution",
      theme: "gold",
      note: "DevRoom inverts the default: sandboxes first, org chart second, approval pipeline third.",
      html: `
        <p class="rv eyebrow">Chapter 05 · Solution</p>
        <h2 class="rv split-target">Virtual engineering<br>command center.</h2>
        <p class="rv body center">Thirteen markdown-defined agents run via the <strong>Cursor SDK</strong> inside rsync sandboxes. Live repos at <code>~/Desktop/Projects/</code> are never touched.</p>
        <div class="rv card-grid two">
          <article class="glass-card magnetic"><h3>Sandbox-first</h3><p><code>validateSandboxPath()</code> + realpath — agents cannot escape even via symlinks.</p></article>
          <article class="glass-card magnetic"><h3>Org chart, not chat</h3><p>APEX delegates to FORGE, VAULT, SHIELD, PIXEL — each with specs, salaries, workspaces.</p></article>
        </div>`,
    },
    {
      ch: "06",
      title: "Workflow",
      theme: "cyan",
      note: "Walk the core loop slowly. Low risk auto-runs; Medium/High hits approval queue.",
      html: `
        <p class="rv eyebrow">Chapter 06 · Core loop</p>
        <h2 class="rv split-target">How work flows.</h2>
        <div class="rv pipeline">
          <div class="pipe-step"><b>01</b><span>Briefing</span></div><div class="pipe-line"></div>
          <div class="pipe-step"><b>02</b><span>CEO command</span></div><div class="pipe-line"></div>
          <div class="pipe-step"><b>03</b><span>Risk tier</span></div><div class="pipe-line"></div>
          <div class="pipe-step"><b>04</b><span>Approval</span></div><div class="pipe-line"></div>
          <div class="pipe-step"><b>05</b><span>Sandbox run</span></div><div class="pipe-line"></div>
          <div class="pipe-step"><b>06</b><span>Token log</span></div>
        </div>
        <ul class="rv check-list">
          <li>Low risk → auto-run · Medium/High → founder approval</li>
          <li>One concurrent run per sandbox — no race conditions</li>
          <li>Markroom handoff via <code>POST /api/handoff</code></li>
        </ul>`,
    },
    {
      ch: "07",
      title: "Agents",
      theme: "violet",
      note: "13 real roles. APEX is CEO — delegates only. FORGE owns architecture. VAULT owns security.",
      html: `
        <p class="rv eyebrow">Chapter 07 · Engineering org</p>
        <h2 class="rv split-target">Thirteen codename agents.</h2>
        <p class="rv caption center">Live status · token salaries · sandbox workspaces</p>
        <div class="rv agent-wall">
          ${["APEX:CEO","FORGE:CTO","PRISM:PM","PIXEL:UI","CORE:Backend","SHIELD:QA","VAULT:Sec","SCROLL:Docs","QUILL:Write","SLIDE:Deck","PITCH:IR","LENS:Research","INK:Content"]
            .map((a) => {
              const [n, r] = a.split(":");
              const lead = n === "APEX" || n === "FORGE" ? " lead" : "";
              return `<div class="agent-tile magnetic${lead}"><strong>${n}</strong><span>${r}</span></div>`;
            })
            .join("")}
        </div>`,
    },
    {
      ch: "08",
      title: "Security",
      theme: "red",
      note: "v3.1.0 closed P0 approval bypass. This is trust infrastructure for production-adjacent work.",
      html: `
        <p class="rv eyebrow">Chapter 08 · Trust</p>
        <h2 class="rv split-target">Security hardened.</h2>
        <div class="rv card-grid two">
          <article class="glass-card magnetic"><h3>P0 · Approval bypass closed</h3><p>Client cannot set <code>approved</code>. Only <code>runAgentAfterApproval()</code> on the server.</p></article>
          <article class="glass-card magnetic"><h3>Sandbox escape blocked</h3><p><code>fs.realpathSync</code> on every agent cwd under <code>sandboxes/</code>.</p></article>
          <article class="glass-card magnetic"><h3>API authentication</h3><p><code>DEVROOM_API_TOKEN</code> for LAN/Render. Reset blocked in production.</p></article>
          <article class="glass-card magnetic"><h3>Honest AI labeling</h3><p>Smart Assistant where rules apply. Cursor SDK where agents run. No fake hype.</p></article>
        </div>`,
    },
    {
      ch: "09",
      title: "Product",
      theme: "gold",
      note: "v3.1.0 ship list — token salaries, themes, mobile, Markroom parity.",
      html: `
        <p class="rv eyebrow">Chapter 09 · v3.1.0</p>
        <h2 class="rv split-target">What shipped.</h2>
        <div class="rv card-grid two">
          <article class="glass-card magnetic"><h3>Token salaries</h3><p>Tokens · USD · runs on every org chart card.</p></article>
          <article class="glass-card magnetic"><h3>Theme system</h3><p>Light / dark / system — Cap family parity.</p></article>
          <article class="glass-card magnetic"><h3>Cap DevRoom Mobile</h3><p>Expo companion — approve from iPhone.</p></article>
          <article class="glass-card magnetic"><h3>Markroom handoff</h3><p>Engineering tasks inbound from marketing office.</p></article>
        </div>
        <div class="rv pill-row"><span class="pill">Cloud agents</span><span class="pill">Stale warnings</span><span class="pill">Job queue</span></div>`,
    },
    {
      ch: "10",
      title: "Mobile",
      theme: "cyan",
      type: "carousel",
      note: "Drag the phone carousel. Same REST API as dashboard — not a WebView wrapper.",
      html: `
        <p class="rv eyebrow">Chapter 10 · Mobile</p>
        <h2 class="rv split-target">Command from your pocket.</h2>
        <p class="rv body center">Expo React Native · Wi‑Fi paired to Mac · Approve SHIELD runs from the couch</p>
        <div class="rv carousel-scene" id="phoneCarousel">
          <div class="carousel-ring">
            <div class="carousel-item" data-i="0"><div class="device"><img src="${MOB}11-mobile-home.png" alt="Home"><span>Command Center</span></div></div>
            <div class="carousel-item" data-i="1"><div class="device"><img src="${MOB}09-mobile-approvals.png" alt="Approvals"><span>Approvals</span></div></div>
            <div class="carousel-item" data-i="2"><div class="device"><img src="${MOB}12-mobile-agents.png" alt="Agents"><span>Agents</span></div></div>
            <div class="carousel-item" data-i="3"><div class="device"><img src="${MOB}10-mobile-settings.png" alt="Settings"><span>Settings</span></div></div>
          </div>
          <p class="rv carousel-hint">Drag to rotate · click a phone to focus</p>
        </div>`,
    },
    {
      ch: "11",
      title: "Mobile setup",
      theme: "cyan",
      split: true,
      note: "Physical iPhone uses LAN IP — never localhost.",
      html: `
        <div class="col-copy">
          <p class="rv eyebrow">Chapter 11 · Setup</p>
          <h2 class="rv split-target">Paired to your Mac.</h2>
          <p class="rv body">From repo root: <code>npm install</code> → <code>npm run dev:mobile</code>. Scan with Expo Go. Paste LAN URL in Settings.</p>
          <ul class="rv check-list">
            <li>Dashboard: <code>npm run dev:stack</code></li>
            <li>Same Wi‑Fi required</li>
            <li>API token if <code>DEVROOM_API_TOKEN</code> set</li>
          </ul>
        </div>
        <div class="col-vis rv">
          <div class="device-hero magnetic"><img src="${MOB}10-mobile-settings.png" alt="Mobile settings"></div>
        </div>`,
    },
    {
      ch: "12",
      title: "Command Center",
      theme: "gold",
      split: true,
      note: "Live product — night shift mode, CEO command, metrics, agent strip.",
      html: `
        <div class="col-copy">
          <p class="rv eyebrow">Chapter 12 · Live</p>
          <h2 class="rv split-target">Command Center.</h2>
          <p class="rv body">The founder's daily surface. Portfolio health, natural-language CEO command, quick actions, live agent status.</p>
        </div>
        <div class="col-vis rv"><div class="screen-3d magnetic"><img src="${IMG}01-command-center.png" alt="Command center"></div></div>`,
    },
    {
      ch: "13",
      title: "Briefing",
      theme: "violet",
      split: true,
      note: "Executive intelligence — APEX directive, priorities, rules vs AI briefing.",
      html: `
        <div class="col-copy">
          <p class="rv eyebrow">Chapter 13 · Live</p>
          <h2 class="rv split-target">Daily Briefing.</h2>
          <p class="rv body">Morning standup: project count, bugs, approvals, priority checklist, APEX recommendation.</p>
        </div>
        <div class="col-vis rv"><div class="screen-3d magnetic"><img src="${IMG}06-briefing.png" alt="Briefing"></div></div>`,
    },
    {
      ch: "14",
      title: "Agents UI",
      theme: "gold",
      split: true,
      note: "Org chart + profile cards with token salary badges.",
      html: `
        <div class="col-copy">
          <p class="rv eyebrow">Chapter 14 · Live</p>
          <h2 class="rv split-target">Org chart + salaries.</h2>
          <p class="rv body">Reporting lines, live status, token · cost · runs, one-click activate → sandbox workspace.</p>
        </div>
        <div class="col-vis rv"><div class="screen-3d magnetic"><img src="${IMG}07-agents-roster.png" alt="Agents"></div></div>`,
    },
    {
      ch: "15",
      title: "Approvals",
      theme: "red",
      split: true,
      note: "Governance inbox — PIXEL design pass, SHIELD e2e, VAULT audit (HIGH).",
      html: `
        <div class="col-copy">
          <p class="rv eyebrow">Chapter 15 · Live</p>
          <h2 class="rv split-target">Approval queue.</h2>
          <p class="rv body">Risk badges, agent context, approve-and-run or reject. Server-side execution only.</p>
        </div>
        <div class="col-vis rv"><div class="screen-3d magnetic"><img src="${IMG}04-approvals.png" alt="Approvals"></div></div>`,
    },
    {
      ch: "16",
      title: "Projects",
      theme: "cyan",
      split: true,
      note: "Portfolio health — 11 projects, issue badges, stale sandbox warnings.",
      html: `
        <div class="col-copy">
          <p class="rv eyebrow">Chapter 16 · Live</p>
          <h2 class="rv split-target">Portfolio health.</h2>
          <p class="rv body">OPTIMAL badges, tech stacks, issue severity, LIVE hub links, sync warnings.</p>
        </div>
        <div class="col-vis rv"><div class="screen-3d magnetic"><img src="${IMG}05-projects.png" alt="Projects"></div></div>`,
    },
    {
      ch: "17",
      title: "Ecosystem",
      theme: "violet",
      note: "Three offices — DevRoom engineering, Markroom marketing, Hub investors.",
      html: `
        <p class="rv eyebrow">Chapter 17 · Ecosystem</p>
        <h2 class="rv split-target">Three offices.<br>One portfolio.</h2>
        <div class="rv eco-grid">
          <article class="glass-card magnetic eco"><div class="eco-icon">⚙</div><h3>Cap · DevRoom</h3><p>Engineering — sandboxes, security, QA, architecture.</p></article>
          <article class="glass-card magnetic eco"><div class="eco-icon">◆</div><h3>Cap · Markroom</h3><p>Marketing — content, SEO, strategy, handoff API.</p></article>
          <article class="glass-card magnetic eco"><div class="eco-icon">◎</div><h3>Capricorn Hub</h3><p>Investor surface — eight apps, device sovereignty.</p></article>
        </div>`,
    },
    {
      ch: "18",
      title: "Stack",
      theme: "gold",
      note: "Turborepo, Next.js 16, Prisma, Render-ready. Reliability first.",
      html: `
        <p class="rv eyebrow">Chapter 18 · Technology</p>
        <h2 class="rv split-target">Production-grade stack.</h2>
        <div class="rv card-grid three">
          <article class="glass-card magnetic"><h3>Monorepo</h3><p>Turborepo · shared · database · dashboard · mobile</p></article>
          <article class="glass-card magnetic"><h3>Dashboard</h3><p>Next.js 16 · Prisma SQLite · PWA · middleware auth</p></article>
          <article class="glass-card magnetic"><h3>Agents</h3><p>Cursor SDK · cloud gate · token-smart memory</p></article>
        </div>
        <div class="rv bar-chart compact">
          <div class="bar-item"><span>Reliability</span><div class="bar-track"><div class="bar-fill" data-w="95"></div></div></div>
          <div class="bar-item"><span>Security</span><div class="bar-track"><div class="bar-fill" data-w="92"></div></div></div>
          <div class="bar-item"><span>UX / Mobile</span><div class="bar-track"><div class="bar-fill" data-w="88"></div></div></div>
        </div>`,
    },
    {
      ch: "19",
      title: "Verified",
      theme: "cyan",
      note: "All doctor checks passed. Public repo. Browser + mobile verified.",
      html: `
        <p class="rv eyebrow">Chapter 19 · Traction</p>
        <h2 class="rv split-target">Shipped and verified.</h2>
        <ul class="rv check-list wide">
          <li><code>npm run doctor</code> — 8/8 sandboxes, health OK</li>
          <li>Build + type-check clean across workspaces</li>
          <li>Full browser walkthrough captured</li>
          <li>Mobile Expo companion linked</li>
          <li>Public GitHub · docs · this deck</li>
        </ul>
        <div class="rv stat-grid compact">
          <div class="stat-card"><span class="stat-num">8/8</span><span class="stat-lbl">Sandboxes</span></div>
          <div class="stat-card"><span class="stat-num">100%</span><span class="stat-lbl">Doctor</span></div>
        </div>`,
    },
    {
      ch: "20",
      title: "Close",
      theme: "gold",
      note: "Close with CTA. npm run dev:stack. npm run dev:mobile. Approve first agent run.",
      html: `
        <p class="rv eyebrow">Chapter 20 · Next steps</p>
        <h1 class="rv hero-title split-target">Your engineering office awaits.</h1>
        <p class="rv lead center">Cap · DevRoom v3.1.0 — dashboard on your Mac, mobile in your pocket, thirteen agents on standby.</p>
        <div class="rv card-grid two cta">
          <article class="glass-card magnetic cta-card"><h3>Start dashboard</h3><p><code>npm run dev:stack</code></p></article>
          <article class="glass-card magnetic cta-card"><h3>Go mobile</h3><p><code>npm run dev:mobile</code></p></article>
        </div>
        <p class="rv meta center">Capricorn Systems · Shamikh Ahmed · 2026</p>`,
    },
  ];
})();
