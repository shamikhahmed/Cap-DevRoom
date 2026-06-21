"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "./Toast";

interface Schedule {
  id: string;
  name: string;
  codename: string;
  task: string;
  projectId: string;
  cadence: string;
  mode: string;
  enabled: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
}

const AGENTS = ["FORGE", "PRISM", "PIXEL", "SHIELD", "SCROLL", "VAULT", "LENS", "INK", "CORE", "APEX"];
const CADENCES = ["hourly", "daily", "weekly"];

export default function SchedulesPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState<Schedule[]>([]);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [codename, setCodename] = useState("SHIELD");
  const [task, setTask] = useState("");
  const [projectId, setProjectId] = useState("VaultCap");
  const [cadence, setCadence] = useState("daily");
  const [mode, setMode] = useState("local");

  const load = useCallback(() => {
    fetch("/api/scheduled").then((r) => r.json()).then((d) => setItems(d.schedules ?? [])).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function create() {
    if (!name.trim() || !task.trim()) return;
    await fetch("/api/scheduled", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, codename, task, projectId, cadence, mode }) });
    setName(""); setTask(""); setShow(false);
    toast({ kind: "success", title: "Crew scheduled" });
    load();
  }
  async function toggle(s: Schedule) {
    await fetch("/api/scheduled", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: s.id, enabled: !s.enabled }) });
    load();
  }
  async function run(s: Schedule) {
    toast({ title: `Dispatching ${s.codename}` });
    await fetch("/api/scheduled", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "run", id: s.id }) });
    toast({ kind: "success", title: "Queued", detail: "Watch the job drawer." });
    load();
  }
  async function remove(s: Schedule) {
    await fetch(`/api/scheduled?id=${s.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mo-card" style={{ padding: 18, marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div className="t-headline">Autonomous Crews</div>
          <div className="t-footnote">Recurring agent runs — QA sweeps, readiness scans, debt audits.</div>
        </div>
        <button className="mo-btn mo-btn-primary" onClick={() => setShow((s) => !s)}>{show ? "Close" : "+ Schedule"}</button>
      </div>

      {show && (
        <div style={{ display: "grid", gap: 8, marginBottom: 14, padding: 12, background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)" }}>
          <input className="mo-input" placeholder="Crew name (e.g. Nightly QA sweep)" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className="mo-textarea" placeholder="Task for the agent…" value={task} onChange={(e) => setTask(e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8 }}>
            <select className="mo-select" value={codename} onChange={(e) => setCodename(e.target.value)}>{AGENTS.map((a) => <option key={a}>{a}</option>)}</select>
            <input className="mo-input" placeholder="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
            <select className="mo-select" value={cadence} onChange={(e) => setCadence(e.target.value)}>{CADENCES.map((c) => <option key={c}>{c}</option>)}</select>
            <select className="mo-select" value={mode} onChange={(e) => setMode(e.target.value)}><option value="local">local</option><option value="cloud">cloud</option></select>
          </div>
          <button className="mo-btn mo-btn-primary" onClick={create}>Create crew</button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="t-footnote" style={{ padding: 16, textAlign: "center" }}>No crews yet. Schedule one to run agents on autopilot.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "var(--bg-hover)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.enabled ? "var(--accent-green)" : "var(--text-muted)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t-subhead" style={{ color: "var(--text-primary)" }}>{s.name}</div>
                <div className="t-caption">{s.codename} · {s.projectId} · {s.cadence} · {s.mode}{s.lastRunAt ? ` · last ${new Date(s.lastRunAt).toLocaleDateString()}` : ""}</div>
              </div>
              <button className="mo-check-approve" onClick={() => run(s)}>Run now</button>
              <button className="mo-check-approve" onClick={() => toggle(s)}>{s.enabled ? "Pause" : "Enable"}</button>
              <button className="mo-check-approve" onClick={() => remove(s)} aria-label="Delete">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
