const gold = "#c9a227";
const goldDim = "#8b6914";

export default {
  light: {
    text: "#111114",
    textMuted: "#52525b",
    background: "#f5f5f7",
    card: "#ffffff",
    border: "rgba(0,0,0,0.08)",
    tint: gold,
    tintDim: goldDim,
    ok: "#248a3d",
    warn: "#b8860b",
    err: "#c41e3a",
    tabIconDefault: "#a1a1aa",
    tabIconSelected: gold,
  },
  dark: {
    text: "#f5f5f7",
    textMuted: "#a1a1aa",
    background: "#0a0a0c",
    card: "#12121a",
    border: "rgba(255,255,255,0.08)",
    tint: gold,
    tintDim: goldDim,
    ok: "#30d158",
    warn: "#ffd60a",
    err: "#ff453a",
    tabIconDefault: "#52525b",
    tabIconSelected: gold,
  },
} as const;

export const brand = {
  name: "Cap · DevRoom",
  tagline: "Your AI development office",
  version: "1.0.0",
};
