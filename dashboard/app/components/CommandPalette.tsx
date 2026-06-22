"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: string;
  run: () => void | Promise<void>;
}

export default function CommandPalette() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const go = useCallback((href: string) => () => { router.push(href); setOpen(false); }, [router]);

  const post = useCallback(
    (url: string, body: unknown, msg: string) => async () => {
      setOpen(false);
      toast({ title: msg, detail: "Working…" });
      try {
        const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        toast({ kind: "success", title: msg, detail: "Done." });
      } catch (e) {
        toast({ kind: "error", title: msg, detail: e instanceof Error ? e.message : "Failed" });
      }
    },
    [toast]
  );

  const commands = useMemo<Command[]>(
    () => [
      { id: "nav-home",        group: "Go to",  label: "Home",                   hint: "Command center",         run: go("/") },
      { id: "nav-launch",      group: "Go to",  label: "Launch Control",         hint: "Ship board",             run: go("/launch") },
      { id: "nav-departments", group: "Go to",  label: "Departments",            hint: "All offices",            run: go("/departments") },
      { id: "nav-security",    group: "Go to",  label: "Security Audit",         hint: "VAULT office",           run: go("/security") },
      { id: "nav-release",     group: "Go to",  label: "Release Packages",       hint: "GO / NO GO per app",     run: go("/release") },
      { id: "nav-issues",      group: "Go to",  label: "Issues",                 hint: "Issue tracker",          run: go("/issues") },
      { id: "nav-projects",    group: "Go to",  label: "Projects",               run: go("/projects") },
      { id: "nav-agents",      group: "Go to",  label: "Agents",                 run: go("/agents") },
      { id: "nav-approvals",   group: "Go to",  label: "Approvals",              run: go("/approvals") },
      { id: "nav-briefing",    group: "Go to",  label: "Briefing",               run: go("/briefing") },
      { id: "nav-settings",    group: "Go to",  label: "Settings",               run: go("/settings") },
      { id: "act-newissue",    group: "Create", label: "New issue",              hint: "Track work",             run: go("/issues?new=1") },
      { id: "act-scan",        group: "Run",    label: "Scan launch readiness",  hint: "Self-check every app",   run: post("/api/readiness", { action: "scanAll" }, "Scanning portfolio readiness") },
      { id: "act-security",    group: "Run",    label: "Security audit",         hint: "VAULT scans sandboxes",  run: post("/api/security", { action: "scanAll" }, "Running security audit") },
      { id: "act-report",      group: "Run",    label: "Executive report",       hint: "Board briefing",         run: post("/api/exec-report", {}, "Generating executive report") },
      { id: "act-due",         group: "Run",    label: "Run due crews",          hint: "Autonomous tasks",       run: async () => {
        setOpen(false);
        toast({ title: "Running due crews" });
        try {
          const r = await fetch("/api/scheduled?action=run-due");
          const d = await r.json();
          toast({ kind: "success", title: "Crews dispatched", detail: `${d.ran?.length ?? 0} run` });
        } catch { toast({ kind: "error", title: "Run failed" }); }
      } },
    ],
    [go, post]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => (c.label + " " + (c.hint ?? "") + " " + c.group).toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("devroom:open-cmdk", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("devroom:open-cmdk", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  return (
    <div className="mo-cmdk-backdrop" onClick={() => setOpen(false)}>
      <div className="mo-cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="mo-cmdk-search">
          <span className="mo-cmdk-prefix">⌘</span>
          <input
            ref={inputRef}
            className="mo-cmdk-input"
            placeholder="Search commands, jump anywhere…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter") { e.preventDefault(); filtered[active]?.run(); }
            }}
          />
          <kbd className="mo-cmdk-kbd">esc</kbd>
        </div>
        <div className="mo-cmdk-list">
          {filtered.length === 0 && <div className="mo-cmdk-empty">No matches</div>}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              className={`mo-cmdk-item${i === active ? " active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => c.run()}
            >
              <span className="mo-cmdk-group">{c.group}</span>
              <span className="mo-cmdk-label">{c.label}</span>
              {c.hint && <span className="mo-cmdk-hint">{c.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
