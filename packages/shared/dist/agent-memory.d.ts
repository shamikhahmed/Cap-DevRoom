export interface MemoryBullet {
    date: string;
    title: string;
    excerpt: string;
    status: "completed" | "approved";
}
export declare function trimExcerpt(text: string, max?: number): string;
export declare function appendMemoryBullet(existing: MemoryBullet[], bullet: MemoryBullet): MemoryBullet[];
export declare function formatMemoryBullets(bullets: MemoryBullet[]): string;
//# sourceMappingURL=agent-memory.d.ts.map