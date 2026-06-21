import path from "path";
import { DEVROOM_ROOT } from "./sandboxes";

/**
 * Absolute SQLite path — must run before PrismaClient is constructed.
 *
 * IMPORTANT: respect an explicit DATABASE_URL from the environment (e.g. Render's
 * persistent disk at file:/data/devroom.db). Overwriting it unconditionally sends
 * writes to the ephemeral build dir and wipes all data on every deploy/restart.
 */
const existing = process.env.DATABASE_URL?.trim();
if (!existing || !existing.startsWith("file:")) {
  process.env.DATABASE_URL = `file:${path.join(DEVROOM_ROOT, "data", "devroom.db")}`;
}
