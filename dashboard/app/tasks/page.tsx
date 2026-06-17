"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { AGENTS, getTasks, initStorage, type Task, type TaskPriority, type RiskTier, type TaskStatus } from "../lib/data";
import { persistTask, removeTask, syncFromServer } from "../lib/server-sync";

/* ── Config ────────────────────────────────────────────────── */

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  URGENT: "var(--accent-red)",
  HIGH:   "var(--accent-amber)",
  NORMAL: "var(--accent-cyan)",
  LOW:    "var(--text-secondary)",
};

const PRIORITY_BG: Record<TaskPriority, string> = {
  URGENT: "rgba(255,51,85,0.1)",
  HIGH:   "rgba(255,170,0,0.08)",
  NORMAL: "rgba(0,212,255,0.08)",
  LOW:    "rgba(74,122,154,0.08)",
};

const STATUS_GROUPS: Array<{ status: TaskStatus; label: string; color: string }> = [
  { status: "pending",     label: "PENDING",     color: "var(--accent-amber)" },
  { status: "in_progress", label: "IN PROGRESS", color: "var(--accent-cyan)"  },
  { status: "done",        label: "DONE",        color: "var(--accent-green)" },
];

const AGENT_ACCENT: Record<string, string> = {
  APEX:   "var(--accent-cyan)",
  FORGE:  "var(--accent-amber)",
  PRISM:  "#bc8cff",
  PIXEL:  "var(--accent-cyan)",
  CORE:   "var(--accent-green)",
  SHIELD: "var(--accent-amber)",
  VAULT:  "var(--accent-red)",
  LENS:   "var(--accent-cyan)",
  SCROLL: "var(--text-secondary)",
  INK:    "#bc8cff",
};

/* ── Task row ──────────────────────────────────────────────── */

function TaskRow({
  task,
  onToggleDone,
  onSetStatus,
  onDelete,
}: {
  task: Task;
  onToggleDone: (id: string) => void;
  onSetStatus: (id: string, s: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  const isDone = task.status === "done";
  const agentColor = AGENT_ACCENT[task.agent] ?? "var(--accent-cyan)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        borderRadius: "3px",
        backgroundColor: isDone ? "rgba(0,0,0,0.1)" : "var(--bg-secondary)",
        border: `1px solid ${isDone ? "rgba(28,58,85,0.3)" : "var(--border)"}`,
        opacity: isDone ? 0.55 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleDone(task.id)}
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "2px",
          border: `1px solid ${isDone ? "var(--accent-green)" : "var(--border-bright)"}`,
          backgroundColor: isDone ? "rgba(0,255,136,0.15)" : "transparent",
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "8px",
          color: "var(--accent-green)",
        }}
      >
        {isDone ? "✓" : ""}
      </button>

      {/* Description */}
      <span
        style={{
          flex: 1,
          fontSize: "11px",
          color: isDone ? "var(--text-muted)" : "var(--text-secondary)",
          textDecoration: isDone ? "line-through" : "none",
          lineHeight: 1.4,
          minWidth: 0,
          wordBreak: "break-word",
        }}
      >
        {task.description}
      </span>

      {/* Agent badge */}
      <span
        style={{
          fontSize: "8px",
          padding: "2px 6px",
          borderRadius: "2px",
          backgroundColor: agentColor + "14",
          color: agentColor,
          border: `1px solid ${agentColor}30`,
          letterSpacing: "0.5px",
          flexShrink: 0,
          fontFamily: "var(--font-data)",
        }}
      >
        {task.agent}
      </span>

      {/* Priority badge */}
      <span
        style={{
          fontSize: "8px",
          padding: "2px 6px",
          borderRadius: "2px",
          backgroundColor: PRIORITY_BG[task.priority],
          color: PRIORITY_COLOR[task.priority],
          border: `1px solid ${PRIORITY_COLOR[task.priority]}30`,
          letterSpacing: "0.5px",
          flexShrink: 0,
          fontFamily: "var(--font-data)",
        }}
      >
        {task.priority}
      </span>

      {/* Status toggle */}
      {!isDone && (
        <button
          onClick={() =>
            onSetStatus(task.id, task.status === "pending" ? "in_progress" : "pending")
          }
          style={{
            fontSize: "8px",
            padding: "2px 6px",
            borderRadius: "2px",
            backgroundColor: task.status === "in_progress" ? "rgba(0,212,255,0.1)" : "rgba(28,58,85,0.2)",
            color: task.status === "in_progress" ? "var(--accent-cyan)" : "var(--text-muted)",
            border: `1px solid ${task.status === "in_progress" ? "rgba(0,212,255,0.25)" : "var(--border)"}`,
            cursor: "pointer",
            letterSpacing: "0.5px",
            fontFamily: "var(--font-data)",
            flexShrink: 0,
          }}
        >
          {task.status === "in_progress" ? "●" : "○"}
        </button>
      )}

      {/* Created date */}
      <span style={{ fontSize: "8px", color: "var(--text-muted)", flexShrink: 0 }}>
        {task.createdAt}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        style={{
          fontSize: "10px",
          color: "var(--text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0 2px",
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");

  const [newDesc, setNewDesc] = useState("");
  const [newAgent, setNewAgent] = useState(AGENTS[0].codename);
  const [newPriority, setNewPriority] = useState<TaskPriority>("NORMAL");
  const [newRisk, setNewRisk] = useState<RiskTier>("Low");

  useEffect(() => {
    initStorage();
    syncFromServer().then(() => setTasks(getTasks()));
  }, []);

  function addTask() {
    if (!newDesc.trim()) return;
    const task: Task = {
      id: `task-${Date.now()}`,
      description: newDesc.trim(),
      agent: newAgent,
      priority: newPriority,
      risk: newRisk,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [task, ...tasks];
    setTasks(updated);
    persistTask(task, updated);
    setNewDesc("");
    setNewPriority("NORMAL");
    setNewRisk("Low");
    setShowForm(false);
  }

  function toggleDone(id: string) {
    const updated = tasks.map((t) => {
      if (t.id !== id) return t;
      const isDone = t.status === "done";
      return {
        ...t,
        status: (isDone ? "pending" : "done") as TaskStatus,
        completedAt: isDone ? undefined : new Date().toISOString().split("T")[0],
      };
    });
    setTasks(updated);
    const changed = updated.find((t) => t.id === id);
    if (changed) persistTask(changed, updated);
  }

  function setStatus(id: string, status: TaskStatus) {
    const updated = tasks.map((t) => (t.id === id ? { ...t, status } : t));
    setTasks(updated);
    const changed = updated.find((t) => t.id === id);
    if (changed) persistTask(changed, updated);
  }

  function deleteTask(id: string) {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    removeTask(id, updated);
  }

  const filtered = tasks.filter((t) => {
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchAgent = filterAgent === "all" || t.agent === filterAgent;
    return matchStatus && matchAgent;
  });

  const pending = tasks.filter((t) => t.status !== "done").length;
  const agentsWithTasks = Array.from(new Set(tasks.map((t) => t.agent)));

  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-bright)",
    borderRadius: "3px",
    color: "var(--text-primary)",
    fontFamily: "var(--font-data)",
    fontSize: "11px",
    padding: "7px 10px",
    outline: "none",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
  };

  return (
    <AppShell>
      <div style={{ padding: "28px", maxWidth: "900px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "2.5px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
              DEVROOM // TASK QUEUE
            </div>
            <div className="font-heading" style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
              {pending} Pending Task{pending !== 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>
              {tasks.length} total · {tasks.filter((t) => t.status === "done").length} completed
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-scan"
            style={{
              padding: "8px 16px",
              backgroundColor: showForm ? "rgba(0,212,255,0.12)" : "var(--accent-cyan)",
              color: showForm ? "var(--accent-cyan)" : "var(--bg-primary)",
              border: showForm ? "1px solid rgba(0,212,255,0.35)" : "none",
              borderRadius: "3px",
              fontSize: "10px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
              cursor: "pointer",
              fontFamily: "var(--font-data)",
            }}
          >
            {showForm ? "✕ CANCEL" : "+ ADD TASK"}
          </button>
        </div>

        {/* Add task form */}
        {showForm && (
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-bright)",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "20px",
            }}
          >
            <div style={{ height: "2px", background: "linear-gradient(90deg, var(--accent-cyan), rgba(0,212,255,0.2))" }} />
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "2px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "14px" }}>
                New Task
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  autoFocus
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="Task description..."
                  style={{ ...inputStyle, width: "100%" }}
                />
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={{ display: "block", fontSize: "9px", color: "var(--text-muted)", marginBottom: "4px", letterSpacing: "0.5px" }}>
                      Assign to agent
                    </label>
                    <select
                      value={newAgent}
                      onChange={(e) => setNewAgent(e.target.value)}
                      style={{ ...selectStyle, width: "100%" }}
                    >
                      {AGENTS.map((a) => (
                        <option key={a.codename} value={a.codename}>
                          {a.codename} — {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "9px", color: "var(--text-muted)", marginBottom: "4px", letterSpacing: "0.5px" }}>
                      Priority
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                      style={selectStyle}
                    >
                      {(["URGENT", "HIGH", "NORMAL", "LOW"] as TaskPriority[]).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "9px", color: "var(--text-muted)", marginBottom: "4px", letterSpacing: "0.5px" }}>
                      Risk tier
                    </label>
                    <select
                      value={newRisk}
                      onChange={(e) => setNewRisk(e.target.value as RiskTier)}
                      style={selectStyle}
                    >
                      {(["Low", "Medium", "High"] as RiskTier[]).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button
                      onClick={addTask}
                      className="btn-scan"
                      style={{
                        padding: "7px 20px",
                        backgroundColor: "var(--accent-cyan)",
                        color: "var(--bg-primary)",
                        border: "none",
                        borderRadius: "3px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        letterSpacing: "1px",
                        cursor: "pointer",
                        fontFamily: "var(--font-data)",
                      }}
                    >
                      ADD
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {/* Status filters */}
          <div style={{ display: "flex", gap: "6px" }}>
            {(["all", "pending", "in_progress", "done"] as const).map((s) => {
              const active = filterStatus === s;
              const color =
                s === "pending"     ? "var(--accent-amber)"  :
                s === "in_progress" ? "var(--accent-cyan)"   :
                s === "done"        ? "var(--accent-green)"  :
                "var(--text-secondary)";
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="btn-scan"
                  style={{
                    padding: "5px 10px",
                    fontSize: "8px",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    borderRadius: "3px",
                    border: `1px solid ${active ? color : "var(--border)"}`,
                    backgroundColor: active ? `${color}15` : "var(--bg-card)",
                    color: active ? color : "var(--text-secondary)",
                    cursor: "pointer",
                    fontFamily: "var(--font-data)",
                  }}
                >
                  {s === "in_progress" ? "IN PROGRESS" : s.toUpperCase()}
                  {" "}({tasks.filter((t) => s === "all" || t.status === s).length})
                </button>
              );
            })}
          </div>

          {/* Agent filter */}
          {agentsWithTasks.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                onClick={() => setFilterAgent("all")}
                className="btn-scan"
                style={{
                  padding: "5px 10px",
                  fontSize: "8px",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  borderRadius: "3px",
                  border: `1px solid ${filterAgent === "all" ? "var(--accent-cyan)" : "var(--border)"}`,
                  backgroundColor: filterAgent === "all" ? "rgba(0,212,255,0.1)" : "var(--bg-card)",
                  color: filterAgent === "all" ? "var(--accent-cyan)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontFamily: "var(--font-data)",
                }}
              >
                ALL AGENTS
              </button>
              {agentsWithTasks.map((a) => {
                const active = filterAgent === a;
                const color = AGENT_ACCENT[a] ?? "var(--accent-cyan)";
                return (
                  <button
                    key={a}
                    onClick={() => setFilterAgent(a)}
                    className="btn-scan"
                    style={{
                      padding: "5px 10px",
                      fontSize: "8px",
                      letterSpacing: "0.8px",
                      borderRadius: "3px",
                      border: `1px solid ${active ? color : "var(--border)"}`,
                      backgroundColor: active ? `${color}15` : "var(--bg-card)",
                      color: active ? color : "var(--text-secondary)",
                      cursor: "pointer",
                      fontFamily: "var(--font-data)",
                    }}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Task groups */}
        {tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", fontSize: "11px", color: "var(--text-muted)" }}>
            No tasks yet. Click + ADD TASK to create one.
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", fontSize: "11px", color: "var(--text-muted)" }}>
            No tasks match the current filter.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {STATUS_GROUPS.map(({ status, label, color }) => {
              const groupTasks = filtered.filter((t) => t.status === status);
              if (groupTasks.length === 0) return null;
              return (
                <div key={status}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        backgroundColor: color,
                      }}
                    />
                    <span style={{ fontSize: "9px", letterSpacing: "2px", color, textTransform: "uppercase" }}>
                      {label}
                    </span>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                      ({groupTasks.length})
                    </span>
                    <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${color}30, transparent)` }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {groupTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggleDone={toggleDone}
                        onSetStatus={setStatus}
                        onDelete={deleteTask}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
