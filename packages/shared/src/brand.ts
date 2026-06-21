/** Cap family · DevRoom app — single source for version + naming */
export const APP_VERSION = "3.2.0";

export const BRAND = {
  family: "Cap",
  app: "DevRoom",
  full: "Cap · DevRoom",
  tagline: "Your AI development office for the Cap portfolio",
  pageTitle: "Cap · DevRoom",
  version: APP_VERSION,
  storagePrefix: "capdevroom_",
  legacyPrefixes: ["jarvis_", "meridian_"] as const,
  ceoAgent: "APEX",
} as const;
