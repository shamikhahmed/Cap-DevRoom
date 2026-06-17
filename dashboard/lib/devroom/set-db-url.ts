import path from "path";
import { DEVROOM_ROOT } from "./sandboxes";

/** Absolute SQLite path — must run before PrismaClient is constructed. */
process.env.DATABASE_URL = `file:${path.join(DEVROOM_ROOT, "data", "devroom.db")}`;
