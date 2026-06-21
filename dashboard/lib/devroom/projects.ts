import { ensureDbReady, prisma } from "./db";

/** Real portfolio projects in the DB — replaces hardcoded DEFAULT_PROJECTS so
 * dashboard metrics reflect live state instead of `openBugs: 0` fiction. */

export interface ProjectInput {
  id: string;
  name: string;
  description?: string;
  status?: string;
  stack?: string;
  liveUrl?: string;
  repoUrl?: string;
}

const SEED: ProjectInput[] = [
  {
    id: "CapDevRoom",
    name: "Cap DevRoom",
    description: "AI development office — agents, approvals, sandbox runs, portfolio command center.",
    stack: "Next.js · TypeScript · @cursor/sdk",
    liveUrl: "http://localhost:3000",
  },
  { id: "VaultCap", name: "VaultCap", description: "Zero-knowledge encrypted life vault. Capricorn flagship.", stack: "Vanilla JS · AES-256-GCM · PWA", liveUrl: "https://shamikhahmed.github.io/VaultCap/", repoUrl: "https://github.com/shamikhahmed/VaultCap" },
  { id: "PulseCap", name: "PulseCap", description: "Performance OS — 300+ exercises, Smart Coach, recovery readiness.", stack: "Vanilla JS · PWA", liveUrl: "https://shamikhahmed.github.io/PulseCap/", repoUrl: "https://github.com/shamikhahmed/PulseCap" },
  { id: "PrismCap", name: "PrismCap", description: "38 offline party games. Pass-and-play on one phone.", stack: "React · TypeScript · PWA", liveUrl: "https://shamikhahmed.github.io/PrismCap/", repoUrl: "https://github.com/shamikhahmed/PrismCap" },
  { id: "SteadyCap", name: "SteadyCap", description: "Recovery OS — score, SOS, medicines, journal.", stack: "Vanilla JS · PWA", liveUrl: "https://shamikhahmed.github.io/SteadyCap/", repoUrl: "https://github.com/shamikhahmed/SteadyCap" },
  { id: "LedgerCap", name: "LedgerCap", description: "Pakistani wealth OS — PSX, Meezan funds, Zakat.", stack: "Vanilla JS · PWA", liveUrl: "https://shamikhahmed.github.io/LedgerCap/", repoUrl: "https://github.com/shamikhahmed/LedgerCap" },
  { id: "DeePonyCap", name: "DeePonyCap", description: "Child-safe MLP collector — shelves, wishlist, achievements.", stack: "Vanilla JS · PWA", liveUrl: "https://shamikhahmed.github.io/DeePonyCap/", repoUrl: "https://github.com/shamikhahmed/DeePonyCap" },
  { id: "ScentCap", name: "ScentCap", description: "Fragrance wardrobe — advisor, layering lab, calendar, analytics.", stack: "React · Vite · Tailwind · PWA", liveUrl: "https://shamikhahmed.github.io/ScentCap/", repoUrl: "https://github.com/shamikhahmed/ScentCap" },
  { id: "AuraCap", name: "AuraCap", description: "Apple ecosystem studio — import guide, DNA, layouts.", stack: "React · Vite · Tailwind · PWA", liveUrl: "https://shamikhahmed.github.io/AuraCap/", repoUrl: "https://github.com/shamikhahmed/AuraCap" },
  { id: "CapricornHub", name: "Capricorn Hub", description: "Company marketing site — eight product pages + sovereignty narrative.", stack: "Static HTML", liveUrl: "https://shamikhahmed.github.io/" },
];

export async function seedProjectsIfEmpty(): Promise<void> {
  await ensureDbReady();
  const count = await prisma.project.count();
  if (count > 0) return;
  for (let i = 0; i < SEED.length; i++) {
    const p = SEED[i];
    await prisma.project.create({
      data: {
        id: p.id,
        name: p.name,
        description: p.description ?? "",
        status: p.status ?? "active",
        stack: p.stack,
        liveUrl: p.liveUrl,
        repoUrl: p.repoUrl,
        sortOrder: i,
      },
    });
  }
}

export async function listProjects() {
  await seedProjectsIfEmpty();
  const projects = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
  // Derive openBugs from live issue counts so the number is real, not stored fiction.
  const bugCounts = await prisma.issue.groupBy({
    by: ["projectId"],
    where: { type: "bug", status: { notIn: ["done", "canceled"] } },
    _count: { _all: true },
  });
  const byId = new Map(bugCounts.map((b) => [b.projectId, b._count._all]));
  return projects.map((p) => ({ ...p, openBugs: byId.get(p.id) ?? 0 }));
}

export async function getProject(id: string) {
  await ensureDbReady();
  return prisma.project.findUnique({ where: { id } });
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<ProjectInput, "name" | "description" | "status" | "stack" | "liveUrl" | "repoUrl">> & { health?: number }
) {
  await ensureDbReady();
  return prisma.project.update({ where: { id }, data: patch });
}
