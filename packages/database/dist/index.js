"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
function resolveDatabaseUrl() {
    const existing = process.env.DATABASE_URL?.trim();
    if (existing?.startsWith("file:") && !existing.includes("../")) {
        return existing;
    }
    const home = process.env.HOME || "/tmp";
    const root = process.env.DEVROOM_ROOT ||
        [path_1.default.join(home, "Desktop/Cap-DevRoom"), path_1.default.join(home, "Desktop/Projects/Cap-DevRoom")].find((p) => fs_1.default.existsSync(p)) ||
        path_1.default.join(home, "Desktop/Cap-DevRoom");
    const dbPath = path_1.default.join(root, "data", "devroom.db");
    fs_1.default.mkdirSync(path_1.default.dirname(dbPath), { recursive: true });
    return `file:${dbPath}`;
}
process.env.DATABASE_URL = resolveDatabaseUrl();
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.devroomPrisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.devroomPrisma = exports.prisma;
}
__exportStar(require("@prisma/client"), exports);
//# sourceMappingURL=index.js.map