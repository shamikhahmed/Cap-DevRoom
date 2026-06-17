"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimExcerpt = trimExcerpt;
exports.appendMemoryBullet = appendMemoryBullet;
exports.formatMemoryBullets = formatMemoryBullets;
const MAX_BULLETS = 10;
const MAX_EXCERPT = 120;
function trimExcerpt(text, max = MAX_EXCERPT) {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= max)
        return clean;
    return `${clean.slice(0, max - 1)}…`;
}
function appendMemoryBullet(existing, bullet) {
    const next = [bullet, ...existing.filter((b) => b.title !== bullet.title || b.date !== bullet.date)];
    return next.slice(0, MAX_BULLETS);
}
function formatMemoryBullets(bullets) {
    if (!bullets.length)
        return "";
    return bullets
        .map((b) => `• [${b.date}] ${b.title} (${b.status}): ${b.excerpt}`)
        .join("\n");
}
//# sourceMappingURL=agent-memory.js.map