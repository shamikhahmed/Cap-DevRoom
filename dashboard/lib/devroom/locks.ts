import { ensureDbReady, prisma } from "./db";

/** Durable per-sandbox lock backed by the DB. Survives restarts and works
 * across instances/serverless — replaces the old in-memory Map lock. */

const DEFAULT_TTL_MS = 15 * 60_000; // 15 min — long enough for a Cursor run

export class SandboxBusyError extends Error {
  constructor(public projectId: string) {
    super(`Sandbox "${projectId}" is busy — another agent run is in progress. Try again shortly.`);
    this.name = "SandboxBusyError";
  }
}

export async function acquireSandboxLock(
  projectId: string,
  jobId: string,
  ttlMs = DEFAULT_TTL_MS
): Promise<boolean> {
  await ensureDbReady();
  // Reap any stale lock first (crashed run that never released).
  await prisma.sandboxLock.deleteMany({
    where: { projectId, expiresAt: { lt: new Date() } },
  });
  try {
    await prisma.sandboxLock.create({
      data: { projectId, jobId, expiresAt: new Date(Date.now() + ttlMs) },
    });
    return true;
  } catch {
    return false; // unique constraint → already held
  }
}

export async function releaseSandboxLock(projectId: string): Promise<void> {
  await ensureDbReady();
  await prisma.sandboxLock.deleteMany({ where: { projectId } });
}

export async function withDbSandboxLock<T>(
  projectId: string,
  jobId: string,
  fn: () => Promise<T>
): Promise<T> {
  const key = projectId.trim() || "VaultCap";
  const got = await acquireSandboxLock(key, jobId);
  if (!got) throw new SandboxBusyError(key);
  try {
    return await fn();
  } finally {
    await releaseSandboxLock(key);
  }
}

export async function activeLocks() {
  await ensureDbReady();
  await prisma.sandboxLock.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return prisma.sandboxLock.findMany();
}
