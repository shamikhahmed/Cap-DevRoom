import fs from "fs";
import path from "path";
import { ensureDbReady, prisma } from "./db";
import { resolveSandbox } from "./sandboxes";
import { listProjects } from "./projects";

/**
 * Security scanning office. Runs automated checks against sandbox copies:
 * secrets detection, auth patterns, dependency staleness, OWASP patterns.
 * No network calls — purely static analysis against the sandbox filesystem.
 */

export type SecuritySeverity = "critical" | "high" | "medium" | "low" | "pass";

export interface SecurityFinding {
  id: string;
  category: "secrets" | "auth" | "deps" | "code" | "config" | "privacy";
  severity: SecuritySeverity;
  title: string;
  detail: string;
  file?: string;
}

export interface SecurityReport {
  projectId: string;
  scannedAt: string;
  score: number; // 0-100 (100 = clean)
  grade: "A" | "B" | "C" | "D" | "F";
  findings: SecurityFinding[];
  summary: string;
}

// Patterns for secrets detection
const SECRET_PATTERNS: { pattern: RegExp; title: string; severity: SecuritySeverity }[] = [
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?[A-Za-z0-9_\-]{20,}["']?/gi, title: "Hardcoded API key", severity: "critical" },
  { pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*["'][^"']{8,}["']/gi, title: "Hardcoded secret/password", severity: "critical" },
  { pattern: /sk-[A-Za-z0-9]{32,}/g, title: "OpenAI secret key exposed", severity: "critical" },
  { pattern: /crsr_[A-Za-z0-9]{40,}/g, title: "Cursor API key exposed", severity: "critical" },
  { pattern: /ghp_[A-Za-z0-9]{36}/g, title: "GitHub personal access token", severity: "critical" },
  { pattern: /AKIA[0-9A-Z]{16}/g, title: "AWS access key ID", severity: "critical" },
  { pattern: /(?:private_key|privateKey)\s*[:=]\s*["']-----BEGIN/gi, title: "Private key exposed", severity: "critical" },
  { pattern: /(?:jwt|token)\s*[:=]\s*["']ey[A-Za-z0-9_\-]{20,}["']/gi, title: "Hardcoded JWT token", severity: "high" },
  { pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^:]+:[^@]+@/gi, title: "Database connection string with credentials", severity: "high" },
];

const IGNORE_DIRS = ["node_modules", ".next", "dist", "build", ".git", "coverage"];
const SCAN_EXTS = [".js", ".ts", ".jsx", ".tsx", ".json", ".env", ".yml", ".yaml", ".sh", ".py", ".rb"];

function walkFiles(dir: string, maxFiles = 200): string[] {
  const out: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (out.length >= maxFiles) break;
      if (IGNORE_DIRS.includes(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        out.push(...walkFiles(full, maxFiles - out.length));
      } else if (SCAN_EXTS.includes(path.extname(e.name))) {
        out.push(full);
      }
    }
  } catch { /* ignore unreadable dirs */ }
  return out;
}

function scanSecrets(root: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const files = walkFiles(root, 300);

  for (const file of files) {
    const rel = path.relative(root, file);
    // Skip .env.example and template files
    if (rel.includes(".example") || rel.includes(".sample") || rel.includes(".template")) continue;

    let content: string;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch { continue; }

    for (const { pattern, title, severity } of SECRET_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        findings.push({
          id: `secrets.${rel}.${title}`.replace(/\W+/g, "_"),
          category: "secrets",
          severity,
          title,
          detail: `Found in ${rel}`,
          file: rel,
        });
        break; // one finding per file per pattern type
      }
    }
  }
  return findings;
}

function checkAuth(root: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const files = walkFiles(root, 200);

  // Check for eval() usage
  const evalFiles = files.filter((f) => {
    try { return /\beval\s*\(/.test(fs.readFileSync(f, "utf8")); } catch { return false; }
  });
  if (evalFiles.length > 0) {
    findings.push({ id: "code.eval", category: "code", severity: "high", title: "eval() usage detected", detail: `${evalFiles.length} file(s) use eval() — XSS/injection risk` });
  }

  // Check for innerHTML assignments
  const innerHtmlFiles = files.filter((f) => {
    try { return /\.innerHTML\s*=/.test(fs.readFileSync(f, "utf8")); } catch { return false; }
  });
  if (innerHtmlFiles.length > 2) {
    findings.push({ id: "code.innerhtml", category: "code", severity: "medium", title: "Direct innerHTML assignments", detail: `${innerHtmlFiles.length} file(s) — potential XSS if user-controlled` });
  }

  return findings;
}

function checkDeps(root: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const pkgPath = path.join(root, "package.json");
  if (!fs.existsSync(pkgPath)) return findings;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const all = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    const count = Object.keys(all).length;

    // Check for known risky versions / patterns
    if (all["lodash"] && /^[34]\./.test(String(all["lodash"]))) {
      findings.push({ id: "deps.lodash_old", category: "deps", severity: "medium", title: "Old lodash version", detail: "Lodash 3.x/4.x has known prototype pollution vulnerabilities. Upgrade or replace." });
    }
    if (all["node-fetch"] && /^\^1\./.test(String(all["node-fetch"]))) {
      findings.push({ id: "deps.node_fetch_v1", category: "deps", severity: "low", title: "node-fetch v1 (deprecated)", detail: "Use native fetch or node-fetch v3." });
    }
    if (count > 100) {
      findings.push({ id: "deps.bloat", category: "deps", severity: "low", title: "Dependency bloat", detail: `${count} dependencies — audit for unused packages to reduce attack surface.` });
    }

    // No lockfile = reproducibility risk
    const hasLock = fs.existsSync(path.join(root, "package-lock.json")) ||
      fs.existsSync(path.join(root, "pnpm-lock.yaml")) ||
      fs.existsSync(path.join(root, "yarn.lock"));
    if (!hasLock) {
      findings.push({ id: "deps.no_lockfile", category: "deps", severity: "medium", title: "No dependency lockfile", detail: "Without a lockfile, any install may pull different versions. Supply chain risk." });
    }
  } catch { /* ignore */ }
  return findings;
}

function checkPrivacy(root: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  const hasPrivacy = fs.existsSync(path.join(root, "PRIVACY.md")) ||
    fs.existsSync(path.join(root, "privacy-policy.md")) ||
    fs.existsSync(path.join(root, "privacy.html")) ||
    fs.existsSync(path.join(root, "PRIVACY_POLICY.md")) ||
    fs.existsSync(path.join(root, "privacy-policy.html"));

  if (!hasPrivacy) {
    findings.push({ id: "privacy.missing", category: "privacy", severity: "high", title: "No privacy policy", detail: "Required for App Store / Play Store submission and GDPR compliance." });
  }

  const hasTerms = fs.existsSync(path.join(root, "TERMS.md")) ||
    fs.existsSync(path.join(root, "terms.html")) ||
    fs.existsSync(path.join(root, "TERMS_OF_SERVICE.md"));
  if (!hasTerms) {
    findings.push({ id: "privacy.no_terms", category: "privacy", severity: "medium", title: "No terms of service", detail: "Required for commercial apps and App Store." });
  }

  return findings;
}

function scoreReport(findings: SecurityFinding[]): { score: number; grade: "A" | "B" | "C" | "D" | "F" } {
  const penalty = findings.reduce((s, f) => {
    if (f.severity === "critical") return s + 30;
    if (f.severity === "high") return s + 15;
    if (f.severity === "medium") return s + 7;
    if (f.severity === "low") return s + 3;
    return s;
  }, 0);
  const score = Math.max(0, 100 - penalty);
  const grade: "A" | "B" | "C" | "D" | "F" =
    score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  return { score, grade };
}

export async function scanProjectSecurity(projectId: string): Promise<SecurityReport> {
  const root = resolveSandbox(projectId);
  const findings: SecurityFinding[] = [];

  if (root) {
    findings.push(...scanSecrets(root));
    findings.push(...checkAuth(root));
    findings.push(...checkDeps(root));
    findings.push(...checkPrivacy(root));
  } else {
    findings.push({ id: "config.no_sandbox", category: "config", severity: "medium", title: "No sandbox synced", detail: "Run npm run sync:sandboxes to enable security scanning." });
  }

  const { score, grade } = scoreReport(findings);
  const criticals = findings.filter((f) => f.severity === "critical").length;
  const highs = findings.filter((f) => f.severity === "high").length;
  const summary = findings.length === 0
    ? "No issues found — clean security posture."
    : `${criticals} critical, ${highs} high, ${findings.length - criticals - highs} other findings.`;

  // Persist to DB as a readiness-style check
  await ensureDbReady();
  await prisma.readinessCheck.upsert({
    where: { projectId_checkId: { projectId, checkId: "security.scan" } },
    create: { projectId, checkId: "security.scan", category: "Security", label: "Security scan", status: criticals > 0 ? "fail" : highs > 0 ? "warn" : "pass", detail: summary, auto: true },
    update: { status: criticals > 0 ? "fail" : highs > 0 ? "warn" : "pass", detail: summary },
  });

  return { projectId, scannedAt: new Date().toISOString(), score, grade, findings, summary };
}

export async function scanAllSecurity(): Promise<SecurityReport[]> {
  const projects = await listProjects();
  return Promise.all(projects.map((p) => scanProjectSecurity(p.id)));
}

export interface PortfolioSecuritySummary {
  avgScore: number;
  criticalCount: number;
  projectsAtRisk: string[];
  reports: { projectId: string; name: string; score: number; grade: string; criticals: number }[];
}

export async function portfolioSecuritySummary(): Promise<PortfolioSecuritySummary> {
  const projects = await listProjects();
  // Use cached readiness checks instead of re-scanning (fast path)
  const checks = await prisma.readinessCheck.findMany({
    where: { checkId: "security.scan" },
  });
  const checkMap = new Map(checks.map((c) => [c.projectId, c]));

  const reports = projects.map((p) => {
    const c = checkMap.get(p.id);
    const score = c?.status === "pass" ? 90 : c?.status === "warn" ? 65 : c?.status === "fail" ? 30 : 50;
    const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
    return { projectId: p.id, name: p.name, score, grade, criticals: c?.status === "fail" ? 1 : 0 };
  });

  const avgScore = reports.length ? Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length) : 100;
  const criticalCount = reports.filter((r) => r.criticals > 0).length;
  const projectsAtRisk = reports.filter((r) => r.score < 60).map((r) => r.name);

  return { avgScore, criticalCount, projectsAtRisk, reports };
}
