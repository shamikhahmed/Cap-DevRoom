import fs from "fs";
import path from "path";
import { ensureDbReady, prisma } from "./db";
import { resolveSandbox } from "./sandboxes";
import { normalizeProjectId } from "./portfolio";

/**
 * Launch-readiness engine. Agents (and the founder) get a self-checking
 * checklist per app: which deliverables exist, what's App-Store ready, what's
 * ready to launch. Auto checks inspect the real sandbox copy; manual checks are
 * founder sign-offs that persist until reset.
 */

export type CheckStatus = "pass" | "warn" | "fail" | "pending" | "na";
export type CheckCategory = "Product" | "Engineering" | "QA" | "Release" | "AppStore" | "Launch";

interface SandboxCtx {
  root: string;
  exists: (rel: string) => boolean;
  existsAny: (rels: string[]) => boolean;
  readSize: (rel: string) => number;
  readJson: (rel: string) => Record<string, unknown> | null;
  /** any file under dir whose name matches the regex */
  matchIn: (dir: string, re: RegExp) => boolean;
}

interface CheckDef {
  id: string;
  category: CheckCategory;
  label: string;
  weight: number;
  /** Auto checks evaluate against the sandbox; manual checks are founder sign-offs. */
  evaluate?: (ctx: SandboxCtx) => { status: CheckStatus; detail?: string };
}

function pass(detail?: string) { return { status: "pass" as CheckStatus, detail }; }
function warn(detail?: string) { return { status: "warn" as CheckStatus, detail }; }
function fail(detail?: string) { return { status: "fail" as CheckStatus, detail }; }

export const CHECK_DEFS: CheckDef[] = [
  // ── Product ────────────────────────────────────────────────
  { id: "product.readme", category: "Product", label: "README documented", weight: 2, evaluate: (c) =>
      c.readSize("README.md") > 300 ? pass() : c.exists("README.md") ? warn("README is thin") : fail("No README.md") },
  { id: "product.changelog", category: "Product", label: "Changelog maintained", weight: 1, evaluate: (c) =>
      c.existsAny(["CHANGELOG.md", "changelog.html"]) ? pass() : warn("No changelog") },
  { id: "product.version", category: "Product", label: "Version pinned", weight: 1, evaluate: (c) => {
      if (c.exists("VERSION.json")) return pass("VERSION.json");
      const pkg = c.readJson("package.json");
      return pkg?.version ? pass(`v${pkg.version}`) : warn("No version") } },

  // ── Engineering ────────────────────────────────────────────
  { id: "eng.package", category: "Engineering", label: "Package manifest", weight: 1, evaluate: (c) =>
      c.exists("package.json") ? pass() : warn("No package.json (static app)") },
  { id: "eng.build", category: "Engineering", label: "Buildable / shippable artifact", weight: 2, evaluate: (c) => {
      const pkg = c.readJson("package.json");
      const scripts = (pkg?.scripts ?? {}) as Record<string, string>;
      if (scripts.build) return c.existsAny(["dist", "build"]) ? pass("build script + output") : warn("build script, no output yet");
      return c.exists("index.html") ? pass("static index.html") : fail("No build or entry") } },
  { id: "eng.lockfile", category: "Engineering", label: "Reproducible deps (lockfile)", weight: 1, evaluate: (c) =>
      c.existsAny(["package-lock.json", "pnpm-lock.yaml", "yarn.lock"]) ? pass() : warn("No lockfile") },

  // ── QA ─────────────────────────────────────────────────────
  { id: "qa.tests", category: "QA", label: "Test suite present", weight: 2, evaluate: (c) =>
      c.existsAny(["tests", "e2e", "__tests__", "test"]) ? pass() : fail("No tests") },
  { id: "qa.runner", category: "QA", label: "Test runner configured", weight: 1, evaluate: (c) => {
      if (c.existsAny(["playwright.config.js", "playwright.config.ts", "vitest.config.ts", "jest.config.js"])) return pass();
      const pkg = c.readJson("package.json");
      const scripts = (pkg?.scripts ?? {}) as Record<string, string>;
      return scripts.test ? pass("test script") : warn("No runner config") } },
  { id: "qa.evidence", category: "QA", label: "Tests have run (results)", weight: 1, evaluate: (c) =>
      c.existsAny(["test-results", "playwright-report", "coverage"]) ? pass() : warn("No recent test run") },

  // ── Release ────────────────────────────────────────────────
  { id: "release.ci", category: "Release", label: "CI / deploy pipeline", weight: 2, evaluate: (c) =>
      c.exists(".github/workflows") ? pass() : warn("No CI workflow") },
  { id: "release.license", category: "Release", label: "License", weight: 1, evaluate: (c) =>
      c.existsAny(["LICENSE", "LICENSE.md", "LICENSE.txt"]) ? pass() : warn("No LICENSE") },
  { id: "release.sw", category: "Release", label: "Offline / service worker", weight: 1, evaluate: (c) =>
      c.existsAny(["sw.js", "service-worker.js", "public/sw.js"]) ? pass() : warn("No service worker") },

  // ── App Store / Mobile ─────────────────────────────────────
  { id: "appstore.manifest", category: "AppStore", label: "Installable manifest (PWA)", weight: 2, evaluate: (c) =>
      c.existsAny(["manifest.json", "manifest.webmanifest", "public/manifest.json", "public/manifest.webmanifest"]) ? pass() : fail("No web manifest") },
  { id: "appstore.icon512", category: "AppStore", label: "App icon ≥512px", weight: 1, evaluate: (c) =>
      c.matchIn(".", /icon.*512.*\.png$/i) || c.matchIn("assets", /icon.*512.*\.png$/i) || c.matchIn("public", /icon.*512.*\.png$/i) ? pass() : warn("No 512px icon") },
  { id: "appstore.icon1024", category: "AppStore", label: "App Store icon 1024px", weight: 2, evaluate: (c) =>
      c.matchIn(".", /1024.*\.png$/i) || c.matchIn("assets", /1024.*\.png$/i) || c.matchIn("public", /1024.*\.png$/i) ? pass() : fail("No 1024px store icon") },
  { id: "appstore.native", category: "AppStore", label: "Native wrapper (iOS/Android)", weight: 2, evaluate: (c) =>
      c.existsAny(["capacitor.config.json", "capacitor.config.ts", "ios", "android", "app.json", "eas.json"]) ? pass() : warn("PWA only — needs wrapper for store") },
  { id: "appstore.screenshots", category: "AppStore", label: "Store screenshots", weight: 1, evaluate: (c) =>
      c.existsAny(["screenshots", "docs/screenshots", "store-assets", "public/screenshots", "fastlane"]) ? pass() : warn("No store screenshots") },
  { id: "playstore.bundle", category: "AppStore", label: "Play Store: Android bundle", weight: 2, evaluate: (c) =>
      c.existsAny(["android", "app/build.gradle", "build.gradle"]) ? pass() : warn("No Android project — Play Store not configured") },
  { id: "playstore.keystore", category: "AppStore", label: "Play Store: Release keystore", weight: 2, evaluate: (c) =>
      c.existsAny(["android/app/keystore.jks", "android/release.keystore", "keystore.jks", "release.keystore"]) ? pass() : warn("No release keystore — needed for Play Store upload") },
  { id: "playstore.metadata", category: "AppStore", label: "Play Store: Metadata (fastlane/supply)", weight: 1, evaluate: (c) =>
      c.existsAny(["fastlane/metadata/android", "fastlane/Supplyfile", "store_listings"]) ? pass() : warn("No Play Store metadata configured") },
  { id: "playstore.google_services", category: "AppStore", label: "Play Store: google-services.json", weight: 1, evaluate: (c) =>
      c.existsAny(["android/app/google-services.json", "google-services.json"]) ? pass() : warn("No google-services.json — required for Firebase/push") },

  // ── Launch ─────────────────────────────────────────────────
  { id: "launch.privacy", category: "Launch", label: "Privacy policy", weight: 2, evaluate: (c) =>
      c.existsAny(["PRIVACY.md", "privacy.html", "public/privacy.html"]) ? pass() : fail("No privacy policy (store blocker)") },
  { id: "launch.landing", category: "Launch", label: "Landing / marketing page", weight: 1, evaluate: (c) =>
      c.existsAny(["landing.html", "pitch.html", "presentation.html", "docs/landing.html"]) ? pass() : warn("No landing page") },
  // Manual founder sign-offs (no evaluate → stays pending until approved)
  { id: "launch.qa_signoff", category: "Launch", label: "QA sign-off (founder)", weight: 2 },
  { id: "appstore.submitted", category: "AppStore", label: "Submitted to App Store / TestFlight", weight: 2 },
  { id: "launch.go", category: "Launch", label: "Founder GO for launch", weight: 3 },
];

const DEF_BY_ID = new Map(CHECK_DEFS.map((d) => [d.id, d]));

function makeCtx(root: string): SandboxCtx {
  const abs = (rel: string) => path.join(root, rel);
  const exists = (rel: string) => fs.existsSync(abs(rel));
  return {
    root,
    exists,
    existsAny: (rels) => rels.some(exists),
    readSize: (rel) => {
      try { return fs.statSync(abs(rel)).size; } catch { return 0; }
    },
    readJson: (rel) => {
      try { return JSON.parse(fs.readFileSync(abs(rel), "utf8")); } catch { return null; }
    },
    matchIn: (dir, re) => {
      try { return fs.readdirSync(abs(dir)).some((f) => re.test(f)); } catch { return false; }
    },
  };
}

export interface ReadinessItem {
  checkId: string;
  category: CheckCategory;
  label: string;
  status: CheckStatus;
  detail?: string;
  auto: boolean;
  weight: number;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ReadinessReport {
  projectId: string;
  score: number; // 0-100
  ready: boolean;
  counts: { pass: number; warn: number; fail: number; pending: number; total: number };
  categories: { name: CheckCategory; score: number; items: ReadinessItem[] }[];
}

function statusWeight(s: CheckStatus): number {
  if (s === "pass") return 1;
  if (s === "warn") return 0.5;
  return 0; // fail | pending | na
}

function isManual(def: CheckDef): boolean {
  return !def.evaluate;
}

/** Inspect the sandbox and persist fresh auto-check results. Manual checks untouched. */
export async function runReadinessScan(projectIdRaw: string): Promise<ReadinessReport> {
  await ensureDbReady();
  const projectId = normalizeProjectId(projectIdRaw);

  let root: string | null = null;
  try {
    root = resolveSandbox(projectId);
  } catch {
    root = null;
  }
  const ctx = root ? makeCtx(root) : null;

  for (const def of CHECK_DEFS) {
    if (isManual(def)) continue;
    let status: CheckStatus = "na";
    let detail: string | undefined = root ? undefined : "No sandbox synced";
    if (ctx && def.evaluate) {
      const r = def.evaluate(ctx);
      status = r.status;
      detail = r.detail;
    }
    await prisma.readinessCheck.upsert({
      where: { projectId_checkId: { projectId, checkId: def.id } },
      create: { projectId, checkId: def.id, category: def.category, label: def.label, status, detail, auto: true },
      update: { status, detail, category: def.category, label: def.label, auto: true },
    });
  }

  return getReadiness(projectId);
}

/** Merge stored rows with definitions (manual checks default to pending). */
export async function getReadiness(projectIdRaw: string): Promise<ReadinessReport> {
  await ensureDbReady();
  const projectId = normalizeProjectId(projectIdRaw);
  const rows = await prisma.readinessCheck.findMany({ where: { projectId } });
  const byId = new Map(rows.map((r) => [r.checkId, r]));

  const items: ReadinessItem[] = CHECK_DEFS.map((def) => {
    const row = byId.get(def.id);
    return {
      checkId: def.id,
      category: def.category,
      label: def.label,
      weight: def.weight,
      auto: !isManual(def),
      status: (row?.status as CheckStatus) ?? "pending",
      detail: row?.detail ?? undefined,
      approvedBy: row?.approvedBy ?? undefined,
      approvedAt: row?.approvedAt ? row.approvedAt.toISOString() : undefined,
    };
  });

  const cats: CheckCategory[] = ["Product", "Engineering", "QA", "Release", "AppStore", "Launch"];
  const categories = cats.map((name) => {
    const catItems = items.filter((i) => i.category === name);
    return { name, score: weightedScore(catItems), items: catItems };
  });

  const counts = {
    pass: items.filter((i) => i.status === "pass").length,
    warn: items.filter((i) => i.status === "warn").length,
    fail: items.filter((i) => i.status === "fail").length,
    pending: items.filter((i) => i.status === "pending").length,
    total: items.length,
  };
  const score = weightedScore(items);
  return { projectId, score, ready: score >= 90 && counts.fail === 0, counts, categories };
}

function weightedScore(items: ReadinessItem[]): number {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (!total) return 0;
  const got = items.reduce((s, i) => s + statusWeight(i.status) * i.weight, 0);
  return Math.round((got / total) * 100);
}

/** Founder sign-off on a manual (or override) check. */
export async function approveCheck(projectIdRaw: string, checkId: string, actor = "founder", approve = true) {
  await ensureDbReady();
  const projectId = normalizeProjectId(projectIdRaw);
  const def = DEF_BY_ID.get(checkId);
  if (!def) throw new Error("unknown check");
  await prisma.readinessCheck.upsert({
    where: { projectId_checkId: { projectId, checkId } },
    create: {
      projectId, checkId, category: def.category, label: def.label,
      status: approve ? "pass" : "pending", auto: false,
      approvedBy: approve ? actor : null, approvedAt: approve ? new Date() : null,
    },
    update: {
      status: approve ? "pass" : "pending",
      approvedBy: approve ? actor : null,
      approvedAt: approve ? new Date() : null,
    },
  });
  return getReadiness(projectId);
}

export interface PortfolioReadinessRow {
  projectId: string;
  name: string;
  score: number;
  ready: boolean;
  fails: number;
  pending: number;
}

export async function portfolioReadiness(): Promise<PortfolioReadinessRow[]> {
  await ensureDbReady();
  const { listProjects } = await import("./projects");
  const projects = await listProjects();
  const out: PortfolioReadinessRow[] = [];
  for (const p of projects) {
    const r = await getReadiness(p.id);
    out.push({ projectId: p.id, name: p.name, score: r.score, ready: r.ready, fails: r.counts.fail, pending: r.counts.pending });
  }
  return out.sort((a, b) => b.score - a.score);
}

export async function scanAll(): Promise<PortfolioReadinessRow[]> {
  const { listProjects } = await import("./projects");
  const projects = await listProjects();
  for (const p of projects) {
    await runReadinessScan(p.id);
  }
  return portfolioReadiness();
}
