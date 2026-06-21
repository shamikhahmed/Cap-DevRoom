"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "../components/AppShell";
import {
  getKnowledge,
  initStorage,
  type KnowledgeEntry,
} from "../lib/data";
import { resolveKnowledgePath } from "../lib/knowledge-paths";

const CATEGORY_COLOR: Record<string, string> = {
  "Cap DevRoom": "var(--accent)",
  VaultCap: "#5b8dee",
  PulseCap: "#00f2ff",
  PrismCap: "#c77dff",
  SteadyCap: "#c9652b",
  LedgerCap: "#f59e0b",
  DeePonyCap: "#c4367a",
  ScentCap: "#c9a87c",
  AuraCap: "#4f6ef7",
  "Capricorn Hub": "#c9a227",
  Engineering: "var(--accent-cyan)",
  Security: "var(--accent-red)",
};

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLOR[category] ?? "var(--text-secondary)";
  return (
    <span
      style={{
        fontSize: "8px",
        padding: "2px 7px",
        borderRadius: "2px",
        backgroundColor: `${color}12`,
        color,
        border: `1px solid ${color}30`,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        flexShrink: 0,
      }}
    >
      {category}
    </span>
  );
}

function KnowledgeEntryRow({ entry }: { entry: KnowledgeEntry }) {
  const [copied, setCopied] = useState(false);
  const catColor = CATEGORY_COLOR[entry.category] ?? "var(--text-secondary)";
  const repoPath = resolveKnowledgePath(entry);

  async function copyPath() {
    try {
      await navigator.clipboard.writeText(repoPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <details className="mo-knowledge-entry card-hover" style={{ borderLeft: `3px solid ${catColor}60` }}>
      <summary>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <span style={{ fontSize: 14, color: "var(--text-muted)", flexShrink: 0 }}>≡</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                {entry.filename}
              </span>
              <CategoryBadge category={entry.category} />
            </div>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
              {entry.summary.length > 120 ? `${entry.summary.slice(0, 120)}…` : entry.summary}
            </p>
          </div>
          <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>▾</span>
        </div>
      </summary>
      <div className="mo-knowledge-body">
        <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: "12px 0" }}>
          {entry.summary}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <code style={{ fontSize: 11, color: "var(--accent)", wordBreak: "break-all" }}>{repoPath}</code>
          <button type="button" className="mo-btn" onClick={copyPath} style={{ fontSize: 11, padding: "6px 10px" }}>
            {copied ? "Copied" : "Copy path"}
          </button>
          <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>
            Updated {entry.updatedAt}
          </span>
        </div>
      </div>
    </details>
  );
}

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initStorage();
    setEntries(getKnowledge());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setSearch("");
        searchRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const categories = Array.from(new Set(entries.map((e) => e.category)));

  const filtered = entries.filter((e) => {
    const matchSearch =
      search === "" ||
      e.filename.toLowerCase().includes(search.toLowerCase()) ||
      e.summary.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || e.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <AppShell>
      <div className="mo-page" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 24 }}>
          <div className="mo-eyebrow">Knowledge base</div>
          <h1 className="mo-title">
            {entries.length} Document{entries.length !== 1 ? "s" : ""}
          </h1>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
            Managed by SCROLL — press <kbd style={{ fontSize: 10 }}>/</kbd> to search
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: 220, flex: 1 }}>
            <span className="mo-search-prefix">/</span>
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search knowledge base"
              className="mo-input mo-search-input"
              placeholder="Search files, summaries..."
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", ...categories].map((c) => {
              const active = selectedCategory === c;
              const color = c === "all" ? "var(--accent)" : (CATEGORY_COLOR[c] ?? "var(--text-secondary)");
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className={active ? "mo-btn mo-btn-primary" : "mo-btn"}
                  style={{ fontSize: 11, padding: "6px 10px" }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", fontSize: 12, color: "var(--text-muted)" }}>
              {search ? `No results for "${search}"` : "No documents found."}
            </div>
          )}
          {filtered.map((entry) => (
            <KnowledgeEntryRow key={entry.id} entry={entry} />
          ))}
        </div>

        {entries.length > 0 && (
          <div className="mo-knowledge-footer">
            <span>{entries.length} total documents</span>
            <span>{categories.length} categories</span>
            {search && (
              <span style={{ color: "var(--accent)" }}>
                {filtered.length} matching &ldquo;{search}&rdquo;
              </span>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
