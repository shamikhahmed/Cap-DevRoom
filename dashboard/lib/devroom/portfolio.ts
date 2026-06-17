import path from "path";
import {
  CAP_PORTFOLIO_APPS,
  CAPRICORN_HUB_URL,
  LEGACY_TO_CAP,
  normalizeProjectId,
  portfolioById,
  PORTFOLIO_APP_IDS,
  PORTFOLIO_APPS,
  type CapPortfolioApp,
  type PortfolioApp,
} from "@cap/devroom-shared";

export {
  CAP_PORTFOLIO_APPS,
  CAPRICORN_HUB_URL,
  LEGACY_TO_CAP,
  normalizeProjectId,
  portfolioById,
  PORTFOLIO_APP_IDS,
  PORTFOLIO_APPS,
  type CapPortfolioApp,
  type PortfolioApp,
};

const HOME = process.env.HOME || "/tmp";

export const PROJECTS_ROOT =
  process.env.DEVROOM_PROJECTS_ROOT || path.join(HOME, "Desktop/Projects");

export const HUB_URL = CAPRICORN_HUB_URL;

export function productionPath(appId: string): string {
  const app = portfolioById(appId);
  return app ? path.join(PROJECTS_ROOT, app.id) : path.join(PROJECTS_ROOT, appId);
}
