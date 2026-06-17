/** Cap family portfolio — aligned with shamikhahmed.github.io (June 2026). */
export declare const CAPRICORN_HUB_URL = "https://shamikhahmed.github.io";
export declare const CAPRICORN_ABOUT_URL = "https://shamikhahmed.github.io/about.html";
export declare const CAPRICORN_SOVEREIGNTY_URL = "https://shamikhahmed.github.io/sovereignty.html";
export interface CapPortfolioApp {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    marketingUrl: string;
    appUrl: string;
    pitchUrl: string;
    accent: string;
    audience: string;
    githubRepo: string;
    stack: string;
    /** Pre-Capricorn rebrand ids for migration */
    legacyIds: string[];
}
export declare const CAP_PORTFOLIO_APPS: CapPortfolioApp[];
export declare const PORTFOLIO_APP_IDS: string[];
export declare const LEGACY_TO_CAP: Record<string, string>;
export declare function normalizeProjectId(id: string): string;
export declare function portfolioById(id: string): CapPortfolioApp | undefined;
/** @deprecated use CAP_PORTFOLIO_APPS */
export declare const PORTFOLIO_APPS: CapPortfolioApp[];
export type PortfolioApp = CapPortfolioApp;
//# sourceMappingURL=capricorn-ecosystem.d.ts.map