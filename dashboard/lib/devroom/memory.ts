import {
  appendMemoryBullet,
  formatMemoryBullets,
  trimExcerpt,
  type MemoryBullet,
} from "@cap/devroom-shared";
import { ensureDbReady, prisma } from "./db";

function parseBullets(raw: string): MemoryBullet[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is MemoryBullet =>
        typeof b === "object" &&
        b !== null &&
        typeof (b as MemoryBullet).date === "string" &&
        typeof (b as MemoryBullet).title === "string" &&
        typeof (b as MemoryBullet).excerpt === "string"
    );
  } catch {
    return [];
  }
}

export async function getAgentMemory(codename: string): Promise<MemoryBullet[]> {
  await ensureDbReady();
  const row = await prisma.agentMemory.findUnique({
    where: { codename: codename.toUpperCase() },
  });
  return row ? parseBullets(row.bullets) : [];
}

export async function getMemoryContext(codename: string): Promise<string> {
  return formatMemoryBullets(await getAgentMemory(codename));
}

export async function getOfficeMemorySnapshot(maxAgents = 8): Promise<string> {
  await ensureDbReady();
  const rows = await prisma.agentMemory.findMany({
    orderBy: { updatedAt: "desc" },
    take: maxAgents,
  });
  const lines = rows
    .map((row) => {
      const bullets = parseBullets(row.bullets);
      const latest = bullets[0];
      if (!latest) return null;
      return `${row.codename}: ${latest.title} — ${latest.excerpt}`;
    })
    .filter(Boolean);
  return lines.join("\n").slice(0, 900);
}

export async function recordAgentWork(
  codename: string,
  title: string,
  content: string,
  status: "completed" | "approved" = "completed"
) {
  await ensureDbReady();
  const code = codename.toUpperCase();
  const bullet: MemoryBullet = {
    date: new Date().toISOString().slice(0, 10),
    title: title.slice(0, 80),
    excerpt: trimExcerpt(content),
    status,
  };
  const existing = await prisma.agentMemory.findUnique({ where: { codename: code } });
  const bullets = appendMemoryBullet(existing ? parseBullets(existing.bullets) : [], bullet);
  await prisma.agentMemory.upsert({
    where: { codename: code },
    create: { codename: code, bullets: JSON.stringify(bullets) },
    update: { bullets: JSON.stringify(bullets) },
  });
}
