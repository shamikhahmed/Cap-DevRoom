"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORTFOLIO_APPS = exports.LEGACY_TO_CAP = exports.PORTFOLIO_APP_IDS = exports.CAP_PORTFOLIO_APPS = exports.CAPRICORN_SOVEREIGNTY_URL = exports.CAPRICORN_ABOUT_URL = exports.CAPRICORN_HUB_URL = void 0;
exports.normalizeProjectId = normalizeProjectId;
exports.portfolioById = portfolioById;
/** Cap family portfolio — aligned with shamikhahmed.github.io (June 2026). */
exports.CAPRICORN_HUB_URL = "https://shamikhahmed.github.io";
exports.CAPRICORN_ABOUT_URL = "https://shamikhahmed.github.io/about.html";
exports.CAPRICORN_SOVEREIGNTY_URL = "https://shamikhahmed.github.io/sovereignty.html";
exports.CAP_PORTFOLIO_APPS = [
    {
        id: "VaultCap",
        slug: "vaultcap",
        name: "VaultCap",
        tagline: "Encrypted life vault — banks, family, Zakat, smart import",
        marketingUrl: `${exports.CAPRICORN_HUB_URL}/vaultcap.html`,
        appUrl: `${exports.CAPRICORN_HUB_URL}/VaultCap/`,
        pitchUrl: `${exports.CAPRICORN_HUB_URL}/VaultCap/pitch.html`,
        accent: "#5b8dee",
        audience: "Diaspora families, PK/UK/UAE finance",
        githubRepo: "VaultCap",
        stack: "Vanilla JS · AES-256-GCM · PWA",
        legacyIds: ["VaultOS"],
    },
    {
        id: "PulseCap",
        slug: "pulsecap",
        name: "PulseCap",
        tagline: "Performance OS — 300+ exercises, Smart Coach, recovery",
        marketingUrl: `${exports.CAPRICORN_HUB_URL}/pulsecap.html`,
        appUrl: `${exports.CAPRICORN_HUB_URL}/PulseCap/`,
        pitchUrl: `${exports.CAPRICORN_HUB_URL}/PulseCap/pitch.html`,
        accent: "#00f2ff",
        audience: "Athletes and fitness-focused users",
        githubRepo: "PulseCap",
        stack: "Vanilla JS · localStorage · PWA",
        legacyIds: ["FitnessOS", "FitnessOS Pro", "FitnessOS v2"],
    },
    {
        id: "PrismCap",
        slug: "prismcap",
        name: "PrismCap",
        tagline: "38 offline party games — pass-and-play",
        marketingUrl: `${exports.CAPRICORN_HUB_URL}/prismcap.html`,
        appUrl: `${exports.CAPRICORN_HUB_URL}/PrismCap/`,
        pitchUrl: `${exports.CAPRICORN_HUB_URL}/PrismCap/pitch.html`,
        accent: "#c77dff",
        audience: "Families and social groups",
        githubRepo: "PrismCap",
        stack: "React · TypeScript · PWA",
        legacyIds: ["PrismOS"],
    },
    {
        id: "SteadyCap",
        slug: "steadycap",
        name: "SteadyCap",
        tagline: "Recovery OS — score, SOS, medicines, journal",
        marketingUrl: `${exports.CAPRICORN_HUB_URL}/steadycap.html`,
        appUrl: `${exports.CAPRICORN_HUB_URL}/SteadyCap/`,
        pitchUrl: `${exports.CAPRICORN_HUB_URL}/SteadyCap/pitch.html`,
        accent: "#c9652b",
        audience: "Recovery and wellness journeys",
        githubRepo: "SteadyCap",
        stack: "Vanilla JS · localStorage · PWA",
        legacyIds: ["DisciplineOS"],
    },
    {
        id: "LedgerCap",
        slug: "ledgercap",
        name: "LedgerCap",
        tagline: "Wealth OS — PSX, Meezan funds, Zakat, IPO tracker",
        marketingUrl: `${exports.CAPRICORN_HUB_URL}/ledgercap.html`,
        appUrl: `${exports.CAPRICORN_HUB_URL}/LedgerCap/`,
        pitchUrl: `${exports.CAPRICORN_HUB_URL}/LedgerCap/pitch.html`,
        accent: "#f59e0b",
        audience: "Pakistani investors and wealth builders",
        githubRepo: "LedgerCap",
        stack: "Vanilla JS · localStorage · PWA",
        legacyIds: ["StundsOS"],
    },
    {
        id: "DeePonyCap",
        slug: "deeponycap",
        name: "DeePonyCap",
        tagline: "Child-safe MLP collector — shelves, wishlist, achievements",
        marketingUrl: `${exports.CAPRICORN_HUB_URL}/deeponycap.html`,
        appUrl: `${exports.CAPRICORN_HUB_URL}/DeePonyCap/`,
        pitchUrl: `${exports.CAPRICORN_HUB_URL}/DeePonyCap/pitch.html`,
        accent: "#c4367a",
        audience: "Families and young collectors",
        githubRepo: "DeePonyCap",
        stack: "Vanilla JS · PWA",
        legacyIds: ["DeePonyOS", "PonyVault"],
    },
    {
        id: "ScentCap",
        slug: "scentcap",
        name: "ScentCap",
        tagline: "Fragrance wardrobe PWA — advisor, layering, calendar",
        marketingUrl: `${exports.CAPRICORN_HUB_URL}/scentcap.html`,
        appUrl: `${exports.CAPRICORN_HUB_URL}/ScentCap/`,
        pitchUrl: `${exports.CAPRICORN_HUB_URL}/ScentCap/pitch.html`,
        accent: "#c9a87c",
        audience: "Fragrance enthusiasts",
        githubRepo: "ScentCap",
        stack: "React · Vite · Tailwind · PWA",
        legacyIds: [],
    },
    {
        id: "AuraCap",
        slug: "auracap",
        name: "AuraCap",
        tagline: "Apple ecosystem studio — import, DNA, layouts",
        marketingUrl: `${exports.CAPRICORN_HUB_URL}/auracap.html`,
        appUrl: `${exports.CAPRICORN_HUB_URL}/AuraCap/`,
        pitchUrl: `${exports.CAPRICORN_HUB_URL}/AuraCap/pitch.html`,
        accent: "#4f6ef7",
        audience: "Apple power users",
        githubRepo: "AuraCap",
        stack: "React · Vite · Tailwind · PWA",
        legacyIds: [],
    },
];
exports.PORTFOLIO_APP_IDS = exports.CAP_PORTFOLIO_APPS.map((p) => p.id);
exports.LEGACY_TO_CAP = Object.fromEntries(exports.CAP_PORTFOLIO_APPS.flatMap((p) => [[p.id, p.id], ...p.legacyIds.map((l) => [l, p.id])]));
function normalizeProjectId(id) {
    return exports.LEGACY_TO_CAP[id] ?? id;
}
function portfolioById(id) {
    const norm = normalizeProjectId(id);
    return exports.CAP_PORTFOLIO_APPS.find((p) => p.id === norm);
}
/** @deprecated use CAP_PORTFOLIO_APPS */
exports.PORTFOLIO_APPS = exports.CAP_PORTFOLIO_APPS;
//# sourceMappingURL=capricorn-ecosystem.js.map