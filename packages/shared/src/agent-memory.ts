export interface MemoryBullet {
  date: string;
  title: string;
  excerpt: string;
  status: "completed" | "approved";
}

const MAX_BULLETS = 10;
const MAX_EXCERPT = 120;

export function trimExcerpt(text: string, max = MAX_EXCERPT): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

export function appendMemoryBullet(existing: MemoryBullet[], bullet: MemoryBullet): MemoryBullet[] {
  const next = [bullet, ...existing.filter((b) => b.title !== bullet.title || b.date !== bullet.date)];
  return next.slice(0, MAX_BULLETS);
}

export function formatMemoryBullets(bullets: MemoryBullet[]): string {
  if (!bullets.length) return "";
  return bullets
    .map((b) => `• [${b.date}] ${b.title} (${b.status}): ${b.excerpt}`)
    .join("\n");
}
