import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

function resolveDatabaseUrl(): string {
  const existing = process.env.DATABASE_URL?.trim();
  if (existing?.startsWith("file:") && !existing.includes("../")) {
    return existing;
  }

  const home = process.env.HOME || "/tmp";
  const root =
    process.env.DEVROOM_ROOT ||
    [path.join(home, "Desktop/Cap-DevRoom"), path.join(home, "Desktop/Projects/Cap-DevRoom")].find((p) =>
      fs.existsSync(p)
    ) ||
    path.join(home, "Desktop/Cap-DevRoom");

  const dbPath = path.join(root, "data", "devroom.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  return `file:${dbPath}`;
}

process.env.DATABASE_URL = resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as { devroomPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.devroomPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.devroomPrisma = prisma;
}

export * from "@prisma/client";
