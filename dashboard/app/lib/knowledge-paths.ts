import type { KnowledgeEntry } from "./data";

/** Repo-relative paths for portfolio context docs (SCROLL-maintained). */
const PORTFOLIO_CONTEXT: Record<string, string> = {
  VaultCap: "docs/portfolio-context/vaultcap.md",
  PulseCap: "docs/portfolio-context/pulsecap.md",
  PrismCap: "docs/portfolio-context/prismcap.md",
  SteadyCap: "docs/portfolio-context/steadycap.md",
  LedgerCap: "docs/portfolio-context/ledgercap.md",
  DeePonyCap: "docs/portfolio-context/deeponycap.md",
  ScentCap: "docs/portfolio-context/scentcap.md",
  AuraCap: "docs/portfolio-context/auracap.md",
  "Cap DevRoom": "docs/HANDOVER.md",
  Engineering: "CLAUDE.md",
  Security: "agents/vault.md",
};

export function resolveKnowledgePath(entry: KnowledgeEntry): string {
  const mapped = PORTFOLIO_CONTEXT[entry.category];
  if (mapped) return mapped;
  if (entry.category === "Capricorn Hub") return "docs/portfolio-context/README.md";
  return `docs/portfolio-context/${entry.filename}`;
}
