import "./set-db-url";
import { prisma } from "@cap/devroom-database";
import { migrateFromJsonIfEmpty } from "./migrate-db";

let migrated = false;

export async function ensureDbReady() {
  if (migrated) return;
  await migrateFromJsonIfEmpty();
  migrated = true;
}

export { prisma };
