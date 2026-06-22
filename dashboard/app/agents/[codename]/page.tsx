"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { useJobLog } from "../../components/JobLogContext";
import { AGENTS, type Agent } from "../../lib/data";
import { AGENT_PROMPT_TEMPLATES } from "../../lib/prompts";
import { PORTFOLIO_APP_IDS } from "../../lib/portfolio";
import { DEVROOM_AGENT_ORG } from "@cap/devroom-shared";

const AGENT_ACCENT: Record<string, string> = {
  APEX: "var(--accent-cyan)",
  FORGE: "var(--accent-amber)",
  PRISM: "#bc8cff",
  PIXEL: "var(--accent-cyan)",
  CORE: "var(--accent-green)",
  SHIELD: "var(--accent-amber)",
  VAULT: "var(--accent-red)",
  LENS: "var(--accent-cyan)",
  SCROLL: "var(--text-secondary)",
  INK: "#bc8cff",
};

interface JobRow {
  id: string;
  codename: string;
  task: string;
  projectId: string;
  status: string;
  createdAt: string;
}

/** Inner content — rendered inside AppShell, so JobLogProvider is available */
function AgentWorkspaceContent({ agent, codename }: { agent: Agent; codename: string }) {
  const router = useRouter();
  const { openDrawer } = useJobLog();
  const org = DEVROOM_AGENT_ORG[codename as keyof typeof DEVROOM_AGENT_ORG];

  const [task, setTask] = useState("");
  const [projectId, setProjectId] = useState("VaultCap");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [memory, setMemory] = useState<Array<{ date: string; title: string; excerpt: string }>>([]);
  const [salary, setSalary] = useState<{ tokens: number; cost: number; runs: number } | null>(null);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d: { jobs?: JobRow[] }) => {
        setJobs((d.jobs ?? []).filter((j) => j.codename === codename).slice(0, 8));
      })
      .catch(() => {});

    fetch(`/api/memory?codename=${encodeURIComponent(codename)}`)
      .then((r) => r.json())
      .then((d: { bullets?: Array<{ date: string; title: string; excerpt: string }> }) => {
        setMemory(d.bullets ?? []);
      })
      .catch(() => {});

    fetch("/api/agents/roster")
      .then((r) => r.json())
      .then((d: { roster?: Array<{ codename: string; salary: { tokens: number; cost: number; runs: number } }> }) => {
        const row = (d.roster ?? []).find((a) => a.codename === codename);
        if (row) setSalary(row.salary);
      })
      .catch(() => {});
  }, [codename, running]);

  async function runLocal() {
    if (!task.trim()) return;
    setRunning(true);
    setOutput("");
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codename, task, projectId }),
      });
      const data = await res.json();
      setOutput(data.output || data.error || JSON.stringify(data, null, 2));
      if (data.ok && data.jobId) openDrawer(data.jobId);
    } catch (e) {
      setOutput(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  const accent = AGENT_ACCENT[codename] ?? "var(--accent-cyan)";
  const tpl = AGENT_PROMPT_TEMPLATES[codename];

  return (
    <div className="mo-page" style={{ maxWidth: 900 }}>
      <button type="button" className="mo-btn" style={{ marginBottom: 16 }} onClick={() => router.push("/agents")}>
        ← Back to roster
      </button>

      <div className="mo-eyebrow">Agent workspace</div>
      <h1 className="mo-title mo-title-colored" style={{ color: accent }}>
        {agent.codename} · {agent.name}
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>
        {org?.jobDescription ?? agent.description}
      </p>

      <div className="mo-detail-grid">
        <div className="mo-card" style={{ padding: 16 }}>
          <div className="mo-section-label">Department</div>
          <div style={{ marginTop: 6 }}>{org?.department ?? agent.role}</div>
        </div>
        <div className="mo-card" style={{ padding: 16 }}>
          <div className="mo-section-label">Reports to</div>
          <div style={{ marginTop: 6 }}>{org?.reportsTo ?? agent.reportsTo}</div>
        </div>
        {salary && (
          <div className="mo-card" style={{ padding: 16, gridColumn: "1 / -1" }}>
            <div className="mo-section-label">Token salary</div>
            <div style={{ fontSize: 14, color: "var(--accent)", marginTop: 6 }}>
              {salary.tokens.toLocaleString()} tokens · ${salary.cost.toFixed(4)} · {salary.runs} runs
            </div>
          </div>
        )}
      </div>

      <div className="mo-card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="mo-section-label" style={{ marginBottom: 12 }}>
          Run in sandbox
        </div>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="mo-input"
          style={{ width: "100%", marginBottom: 12 }}
        >
          {PORTFOLIO_APP_IDS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder={`Task for ${codename}…`}
          rows={4}
          className="mo-input"
          style={{ width: "100%", marginBottom: 12, resize: "vertical", minHeight: 96 }}
        />
        <button
          type="button"
          className="mo-btn mo-btn-primary"
          disabled={running || !task.trim()}
          onClick={runLocal}
          style={{ opacity: running ? 0.6 : 1 }}
        >
          {running ? "Running…" : "Run local agent"}
        </button>
        {output && (
          <pre className="mo-job-output" style={{ marginTop: 16, maxHeight: 320 }}>
            {output}
          </pre>
        )}
      </div>

      <div className="mo-card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="mo-section-label" style={{ marginBottom: 12 }}>Agent memory</div>
        {memory.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            No completed work recorded yet. Memory builds after successful sandbox runs.
          </p>
        ) : (
          memory.map((b, i) => (
            <div key={`${b.date}-${i}`} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
              <div style={{ color: accent, fontWeight: 600 }}>{b.title}</div>
              <div style={{ color: "var(--text-muted)", marginTop: 2 }}>{b.date}</div>
              <div style={{ color: "var(--text-secondary)", marginTop: 4 }}>{b.excerpt}</div>
            </div>
          ))
        )}
      </div>

      <div className="mo-card" style={{ padding: 20 }}>
        <div className="mo-section-label" style={{ marginBottom: 12 }}>Recent jobs</div>
        {jobs.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No jobs yet for {codename}.</p>
        ) : (
          jobs.map((j) => (
            <div key={j.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: accent, fontWeight: 600 }}>{j.status}</span>
                <span style={{ color: "var(--text-muted)" }}>{new Date(j.createdAt).toLocaleString()}</span>
              </div>
              <div style={{ color: "var(--text-secondary)", marginTop: 4 }}>{j.task.slice(0, 120)}</div>
              <div style={{ color: "var(--text-muted)", marginTop: 2 }}>{j.projectId}</div>
            </div>
          ))
        )}
      </div>

      {tpl && (
        <details style={{ marginTop: 20, fontSize: 11, color: "var(--text-muted)" }}>
          <summary>System prompt reference</summary>
          <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{tpl.systemPrompt.slice(0, 800)}…</pre>
        </details>
      )}
    </div>
  );
}

export default function AgentWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const codename = String(params.codename || "").toUpperCase();
  const agent = AGENTS.find((a) => a.codename === codename);

  if (!agent) {
    return (
      <AppShell>
        <div className="mo-page" style={{ padding: 28 }}>
          <p>Unknown agent: {codename}</p>
          <button type="button" className="mo-btn" onClick={() => router.push("/agents")}>
            Back to roster
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AgentWorkspaceContent agent={agent} codename={codename} />
    </AppShell>
  );
}
