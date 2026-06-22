"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import { useToast } from "../components/Toast";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "archived";
  stack?: string | null;
  liveUrl?: string | null;
  repoUrl?: string | null;
  openBugs: number;
  health: number;
}

interface Issue {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  projectId: string;
}

const STATUS_COLOR: Record<Project["status"], string> = {
  active: "var(--accent-green)",
  paused: "var(--accent-amber)",
  archived: "var(--text-muted)",
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "var(--accent-red)", high: "var(--accent-amber)", medium: "var(--text-secondary)", low: "var(--text-muted)", none: "var(--text-muted)",
};

function ProjectsPageInner() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [tab, setTab] = useState<"active" | "paused" | "all">("active");

  const load = useCallback(() => {
    fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(d.projects ?? [])).catch(() => {});
    fetch("/api/issues").then((r) => r.json()).then((d) => setIssues(d.issues ?? [])).catch(() => {});
  }, []);

  useEffect(load, [load]);

  async function cycleStatus(p: Project) {
    const cycle: Project["status"][] = ["active", "paused", "archived"];
    const next = cycle[(cycle.indexOf(p.status) + 1) % cycle.length];
    setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    await fetch("/api/projects", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: p.id, patch: { status: next } }) });
    toast({ title: `${p.name} → ${next}` });
  }

  const counts = {
    all: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    paused: projects.filter((p) => p.status === "paused").length,
  };
  const filtered = tab === "all" ? projects : projects.filter((p) => p.status === tab);
  const openByProject = (id: string) => issues.filter((i) => i.projectId === id && i.status !== "done" && i.status !== "canceled");

  return (
    <>
      <div className="mo-page" style={{ maxWidth: 920 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="mo-eyebrow">Portfolio</div>
            <h1 className="mo-title">{projects.length} Apps Tracked</h1>
            <p className="t-subhead" style={{ marginTop: 6 }}>{issues.filter((i) => i.type === "bug" && i.status !== "done" && i.status !== "canceled").length} open bugs · live from issue tracker</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {(["active", "paused", "all"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="mo-btn" style={{ padding: "6px 14px", borderColor: tab === t ? "var(--accent)" : undefined, color: tab === t ? "var(--text-primary)" : undefined, textTransform: "capitalize" }}>
              {t} ({counts[t]})
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 12 }}>
          {filtered.map((p) => {
            const open = openByProject(p.id);
            return (
              <div key={p.id} className="mo-card card-hover" style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <Link href={`/issues?project=${p.id}`} className="t-headline" style={{ color: "var(--text-primary)", textDecoration: "none" }}>{p.name}</Link>
                    {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="t-caption" style={{ color: "var(--accent-green)", textDecoration: "none" }}>↗ Live</a>}
                  </div>
                  <button onClick={() => cycleStatus(p)} className="mo-signal" style={{ cursor: "pointer", color: STATUS_COLOR[p.status], background: "var(--bg-hover)", border: "none" }}>{p.status}</button>
                </div>
                <p className="t-footnote" style={{ color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 10px" }}>{p.description || "No description."}</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: open.length ? 12 : 0 }}>
                  {p.stack && <span className="t-caption" style={{ color: "var(--accent-cyan)" }}>{p.stack}</span>}
                  <span className="t-caption" style={{ color: p.openBugs ? "var(--accent-amber)" : "var(--accent-green)" }}>{p.openBugs ? `${p.openBugs} open bugs` : "✓ No open bugs"}</span>
                </div>
                {open.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {open.slice(0, 4).map((i) => (
                      <Link key={i.id} href="/issues" style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 8px", borderRadius: 8, background: "var(--bg-hover)", textDecoration: "none" }}>
                        <span className="t-caption" style={{ color: PRIORITY_COLOR[i.priority] }}>●</span>
                        <span className="mo-issue-key">{i.key}</span>
                        <span className="t-footnote" style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function ProjectsPage() {
  return <AppShell><ProjectsPageInner /></AppShell>;
}