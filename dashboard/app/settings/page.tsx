"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { useTheme, type ThemeMode } from "../components/ThemeProvider";
import { resetPortfolioData } from "../lib/data";
import { getStoredApiToken, setStoredApiToken } from "../lib/api-fetch";

interface Health {
  cursorApi: string;
  sandboxes: Array<{ id: string; exists: boolean }>;
}

interface NetworkInfo {
  localhost: string;
  lan: string | null;
  allLan: string[];
  phoneReady: boolean;
}

interface DiagnosticCheck {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn" | "skip";
  detail: string;
}

interface SetupStep {
  step: number;
  title: string;
  detail: string;
  env: string | null;
}

function StatusDot({ status }: { status: DiagnosticCheck["status"] }) {
  return <span className={`mo-status-dot ${status}`} aria-hidden />;
}

export default function SettingsPage() {
  const { theme, setTheme, resolved } = useTheme();
  const [health, setHealth] = useState<Health | null>(null);
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [summary, setSummary] = useState("");
  const [running, setRunning] = useState(true);
  const [diagError, setDiagError] = useState("");
  const [copied, setCopied] = useState(false);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [tokenSaved, setTokenSaved] = useState(false);

  const phoneUrl =
    typeof window !== "undefined" && network?.lan
      ? network.lan
      : network?.lan ?? null;

  const runChecks = useCallback(async () => {
    setRunning(true);
    setDiagError("");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20_000);
    try {
      const r = await fetch("/api/diagnostics", { signal: ctrl.signal });
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      const d = await r.json();
      setChecks(d.checks || []);
      setSummary(d.summary || (d.ok ? "All systems ready" : "Check completed with issues"));
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "AbortError"
          ? "Timed out — Mac server may be asleep or unreachable"
          : e instanceof Error
            ? e.message
            : "Diagnostics failed";
      setDiagError(msg);
      setSummary("Check failed");
      setChecks((prev) =>
        prev.length > 0 ? prev : [{ id: "error", label: "Connection", status: "fail", detail: msg }]
      );
    } finally {
      clearTimeout(timer);
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    setApiToken(getStoredApiToken());
    setHealthLoading(true);
    fetch("/api/health")
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then(setHealth)
      .catch(() => setHealthError("Can't reach Mac server — is start-dashboard.sh running?"))
      .finally(() => setHealthLoading(false));
    fetch("/api/network").then((r) => r.json()).then(setNetwork);
    runChecks();
  }, [runChecks]);

  function saveApiToken() {
    setStoredApiToken(apiToken);
    setTokenSaved(true);
    setTimeout(() => setTokenSaved(false), 2000);
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <AppShell>
      <div className="mo-page" style={{ maxWidth: 720 }}>
        <div className="mo-eyebrow">Setup</div>
        <h1 className="mo-title" style={{ marginBottom: 24 }}>
          Settings
        </h1>

        <section className="mo-card" style={{ padding: 20, marginBottom: 20 }}>
          <div className="mo-section-label" style={{ marginBottom: 12 }}>
            Appearance
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 12px" }}>
            Active theme: <strong style={{ color: "var(--text-primary)" }}>{resolved}</strong>
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["dark", "light", "system"] as ThemeMode[]).map((t) => (
              <button
                key={t}
                type="button"
                className={theme === t ? "mo-btn mo-btn-primary" : "mo-btn"}
                onClick={() => setTheme(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* iPhone access */}
        <section className="mo-card" style={{ padding: 20, marginBottom: 20 }}>
          <div className="mo-section-label" style={{ marginBottom: 12, color: "var(--accent)" }}>
            Run on iPhone
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            <li>Mac and iPhone on the <strong>same Wi‑Fi</strong></li>
            <li>Start server: <code style={{ fontSize: 12 }}>~/Cap-DevRoom/scripts/start-dashboard.sh</code></li>
            <li>On iPhone Safari, open the URL below</li>
            <li>Share → <strong>Add to Home Screen</strong> (works like an app)</li>
          </ol>
          {phoneUrl ? (
            <div className="mo-url-box">
              <code>{phoneUrl}</code>
              <button type="button" className="mo-btn" onClick={() => copyUrl(phoneUrl)} style={{ flexShrink: 0 }}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "var(--accent-red)", marginTop: 12 }}>
              No Wi‑Fi IP found — connect to Wi‑Fi and restart the server.
            </p>
          )}
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12, marginBottom: 0 }}>
            Mac only: {network?.localhost ?? "http://127.0.0.1:3000"}
          </p>
        </section>

        {/* System check */}
        <section className="mo-card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div className="mo-section-label" style={{ marginBottom: 4 }}>System check</div>
              <div
                style={{
                  fontSize: 15,
                  color: running
                    ? "var(--text-secondary)"
                    : diagError || summary.includes("issue") || summary === "Check failed"
                      ? "var(--accent-red)"
                      : "var(--accent-green)",
                }}
              >
                {running ? "Checking…" : summary || "Tap Run again"}
              </div>
              {diagError && !running && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>{diagError}</div>
              )}
            </div>
            <button type="button" className="mo-btn mo-btn-primary" onClick={runChecks} disabled={running}>
              {running ? "Checking…" : "Run again"}
            </button>
          </div>
          {checks.map((c) => (
            <div key={c.id} className="mo-check-row">
              <StatusDot status={c.status} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{c.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{c.detail}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Quick status */}
        <section className="mo-card" style={{ padding: 20, marginBottom: 20 }}>
          <div className="mo-section-label" style={{ marginBottom: 10 }}>At a glance</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.9 }}>
            Cursor API:{" "}
            <strong
              style={{
                color:
                  healthLoading
                    ? "var(--text-secondary)"
                    : health?.cursorApi === "configured"
                      ? "var(--accent-green)"
                      : "var(--accent-red)",
              }}
            >
              {healthLoading
                ? "Checking…"
                : healthError
                  ? "Server offline"
                  : health?.cursorApi === "configured"
                    ? "Ready"
                    : "Missing key on Mac"}
            </strong>
            {healthError && (
              <div style={{ fontSize: 12, color: "var(--accent-red)", marginTop: 6 }}>{healthError}</div>
            )}
            {!healthLoading && !healthError && health?.cursorApi === "missing" && (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                Add <code>CURSOR_API_KEY</code> to <code>~/Cap-DevRoom/dashboard/.env.local</code> on your Mac, then restart the server.
              </div>
            )}
            <br />
            Sandboxes: {health?.sandboxes?.filter((s) => s.exists).length || 0} / {health?.sandboxes?.length || 0} synced
          </div>
        </section>

        {/* API token for iPhone / LAN */}
        <section className="mo-card" style={{ padding: 20, marginBottom: 20 }}>
          <div className="mo-section-label" style={{ marginBottom: 12, color: "var(--accent)" }}>
            API token (iPhone &amp; LAN)
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 12px" }}>
            Set the same token in <code>dashboard/.env.local</code> as <code>DEVROOM_API_TOKEN</code> on your Mac,
            then paste it here on iPhone so approvals and agent runs work over Wi‑Fi.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Paste DEVROOM_API_TOKEN"
              className="mo-input"
              style={{ flex: 1, minWidth: 200 }}
              autoComplete="off"
            />
            <button type="button" className="mo-btn mo-btn-primary" onClick={saveApiToken}>
              {tokenSaved ? "Saved" : "Save token"}
            </button>
          </div>
        </section>

        {/* Portfolio reset */}
        <section className="mo-card" style={{ padding: 20, marginBottom: 20 }}>
          <div className="mo-section-label" style={{ marginBottom: 8 }}>Dashboard shows zeros?</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 12px" }}>
            Portfolio data lives in this browser&apos;s storage. Empty or old data shows 0 projects and 0 approvals.
            Reset restores the demo portfolio (7 projects, 6 approvals, 30+ knowledge docs).
          </p>
          <button
            type="button"
            className="mo-btn mo-btn-primary"
            onClick={async () => {
              resetPortfolioData();
              await fetch("/api/approvals/reset", { method: "POST" });
              window.location.reload();
            }}
          >
            Reset portfolio data
          </button>
        </section>

        <section className="mo-card" style={{ padding: 20 }}>
          <div className="mo-section-label" style={{ marginBottom: 8 }}>How you know it works</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li><strong style={{ color: "var(--text-primary)" }}>Green system check</strong> above — API auth + sandboxes OK</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Home</strong> — metrics and agent roster load</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Agents</strong> — run a sandbox task (Jobs drawer shows progress)</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Approvals</strong> — medium/high risk tasks queue here</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
