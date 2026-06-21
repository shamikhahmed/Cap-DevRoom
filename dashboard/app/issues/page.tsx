"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { useToast } from "../components/Toast";

interface Issue {
  id: string;
  key: string;
  title: string;
  body: string;
  status: string;
  priority: string;
  type: string;
  agent?: string | null;
  projectId: string;
  prUrl?: string | null;
}

const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done", "canceled"];
const PRIORITIES = ["urgent", "high", "medium", "low", "none"];
const TYPES = ["bug", "feature", "task", "chore"];
const AGENTS = ["FORGE", "PRISM", "PIXEL", "SHIELD", "SCROLL", "VAULT", "LENS", "INK", "CORE"];

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "var(--accent-red)", high: "var(--accent-amber)", medium: "var(--text-secondary)", low: "var(--text-muted)", none: "var(--text-muted)",
};

export default function IssuesPage() {
  const { toast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [filter, setFilter] = useState<string>("open");
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(() => {
    fetch("/api/issues").then((r) => r.json()).then((d) => setIssues(d.issues ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    fetch("/api/projects").then((r) => r.json()).then((d) => setProjects((d.projects ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))).catch(() => {});
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") setShowNew(true);
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/issues/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/issues/${id}`, { method: "DELETE" });
    toast({ title: "Issue deleted" });
    load();
  }

  const shown = issues.filter((i) => {
    if (filter === "open") return i.status !== "done" && i.status !== "canceled";
    if (filter === "all") return true;
    return i.status === filter;
  });

  const counts = {
    open: issues.filter((i) => i.status !== "done" && i.status !== "canceled").length,
    in_progress: issues.filter((i) => i.status === "in_progress").length,
    done: issues.filter((i) => i.status === "done").length,
  };

  return (
    <AppShell>
      <div className="mo-page" style={{ maxWidth: 980 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="mo-eyebrow">Engineering</div>
            <h1 className="mo-title">Issues</h1>
            <p className="t-subhead" style={{ marginTop: 6 }}>{counts.open} open · {counts.in_progress} in progress · {counts.done} done</p>
          </div>
          <button className="mo-btn mo-btn-primary" onClick={() => setShowNew((s) => !s)}>{showNew ? "Close" : "+ New issue"}</button>
        </div>

        {showNew && <NewIssue projects={projects} onCreated={() => { setShowNew(false); load(); toast({ kind: "success", title: "Issue created" }); }} />}

        <div style={{ display: "flex", gap: 8, margin: "16px 0", flexWrap: "wrap" }}>
          {["open", "in_progress", "done", "all"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="mo-btn" style={{ padding: "6px 12px", borderColor: filter === f ? "var(--accent)" : undefined, color: filter === f ? "var(--text-primary)" : undefined }}>
              {f.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="mo-card" style={{ overflow: "hidden" }}>
          {shown.length === 0 && <div className="t-subhead" style={{ padding: 40, textAlign: "center" }}>No issues. Create one or run an agent.</div>}
          {shown.map((i) => (
            <div key={i.id} className="mo-issue-row">
              <span className="mo-issue-key">{i.key}</span>
              <div style={{ minWidth: 0 }}>
                <div className="mo-issue-title">{i.title}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                  <span className={`mo-tag mo-tag-${i.type}`}>{i.type}</span>
                  <span className="t-caption" style={{ color: PRIORITY_COLOR[i.priority] }}>● {i.priority}</span>
                  <span className="t-caption">{i.projectId}</span>
                  {i.agent && <span className="t-caption">@{i.agent}</span>}
                </div>
              </div>
              <select className="mo-select" style={{ width: 130 }} value={i.status} onChange={(e) => patch(i.id, { status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
              <button className="mo-check-approve" onClick={() => remove(i.id)} aria-label="Delete">✕</button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function NewIssue({ projects, onCreated }: { projects: { id: string; name: string }[]; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "VaultCap");
  const [type, setType] = useState("task");
  const [priority, setPriority] = useState("medium");
  const [agent, setAgent] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => { if (projects[0] && !projectId) setProjectId(projects[0].id); }, [projects, projectId]);

  async function submit() {
    if (!title.trim()) return;
    await fetch("/api/issues", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, projectId, type, priority, agent: agent || undefined, body }),
    });
    onCreated();
  }

  return (
    <div className="mo-card" style={{ padding: 18 }}>
      <input className="mo-input" placeholder="Issue title…" value={title} autoFocus onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ marginBottom: 10 }} />
      <textarea className="mo-textarea" placeholder="Description (optional)" value={body} onChange={(e) => setBody(e.target.value)} style={{ marginBottom: 10 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 12 }}>
        <select className="mo-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="mo-select" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        <select className="mo-select" value={priority} onChange={(e) => setPriority(e.target.value)}>{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select>
        <select className="mo-select" value={agent} onChange={(e) => setAgent(e.target.value)}>
          <option value="">Unassigned</option>
          {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <button className="mo-btn mo-btn-primary" onClick={submit}>Create issue</button>
    </div>
  );
}
