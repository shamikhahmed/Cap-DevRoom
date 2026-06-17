"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import {
  getKnowledge,
  initStorage,
  type KnowledgeEntry,
} from "../lib/data";

/* ── Category colors ───────────────────────────────────────── */

const CATEGORY_COLOR: Record<string, string> = {
  "Cap DevRoom":  "var(--accent-cyan)",
  VaultCap:      "#5b8dee",
  PulseCap:      "#00f2ff",
  PrismCap:      "#c77dff",
  SteadyCap:     "#c9652b",
  LedgerCap:     "#f59e0b",
  DeePonyCap:    "#c4367a",
  ScentCap:      "#c9a87c",
  AuraCap:       "#4f6ef7",
  "Capricorn Hub": "#c9a227",
  Engineering:  "var(--accent-cyan)",
  Security:     "var(--accent-red)",
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

/* ── Page ──────────────────────────────────────────────────── */

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    initStorage();
    setEntries(getKnowledge());
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
      <div style={{ padding: "28px", maxWidth: "900px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "9px",
              letterSpacing: "2.5px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            DEVROOM // KNOWLEDGE BASE
          </div>
          <div
            className="font-heading"
            style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}
          >
            {entries.length} Document{entries.length !== 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>
            Managed by SCROLL — Chief Knowledge Officer
          </div>
        </div>

        {/* Search + filter */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          {/* Search input */}
          <div style={{ position: "relative", minWidth: "220px", flex: 1 }}>
            <span
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              /
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-bright)",
                borderRadius: "3px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-data)",
                fontSize: "11px",
                padding: "7px 10px 7px 24px",
                outline: "none",
              }}
              placeholder="Search files, summaries..."
            />
          </div>

          {/* Category filters */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["all", ...categories].map((c) => {
              const active = selectedCategory === c;
              const color = c === "all" ? "var(--accent-cyan)" : (CATEGORY_COLOR[c] ?? "var(--text-secondary)");
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  style={{
                    padding: "5px 10px",
                    fontSize: "9px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    borderRadius: "3px",
                    border: `1px solid ${active ? color : "var(--border)"}`,
                    backgroundColor: active ? `${color}12` : "var(--bg-card)",
                    color: active ? color : "var(--text-secondary)",
                    cursor: "pointer",
                    fontFamily: "var(--font-data)",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Entry list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", fontSize: "11px", color: "var(--text-muted)" }}>
              {search ? `No results for "${search}"` : "No documents found."}
            </div>
          )}
          {filtered.map((entry) => {
            const catColor = CATEGORY_COLOR[entry.category] ?? "var(--text-secondary)";
            return (
            <div
              key={entry.id}
              className="card-hover kb-border"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderLeftColor: catColor + "60",
                borderRadius: "4px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
              }}
            >
              {/* File icon */}
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                ≡
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "5px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "var(--text-primary)",
                    }}
                  >
                    {entry.filename}
                  </span>
                  <CategoryBadge category={entry.category} />
                </div>
                <p
                  style={{
                    fontSize: "10px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.55,
                    margin: "0 0 6px",
                  }}
                >
                  {entry.summary}
                </p>
                <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                  Updated: {entry.updatedAt}
                </div>
              </div>

              {/* Path pill */}
              <div
                style={{
                  fontSize: "9px",
                  padding: "3px 8px",
                  borderRadius: "2px",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  letterSpacing: "0.3px",
                  marginTop: "2px",
                }}
              >
                /knowledge/{entry.filename}
              </div>
            </div>
            );
          })}
        </div>

        {/* Footer stats */}
        {entries.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "14px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: "20px",
              fontSize: "9px",
              color: "var(--text-muted)",
              letterSpacing: "0.5px",
            }}
          >
            <span>{entries.length} total documents</span>
            <span>{categories.length} categories</span>
            {search && (
              <span style={{ color: "var(--accent-cyan)" }}>
                {filtered.length} matching &ldquo;{search}&rdquo;
              </span>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
