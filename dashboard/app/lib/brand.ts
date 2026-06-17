import { APP_VERSION, BRAND as SHARED_BRAND } from "@cap/devroom-shared";

/** Cap DevRoom — product branding (client + server safe) */
export const BRAND = {
  ...SHARED_BRAND,
  /** @deprecated use full */
  name: "Cap DevRoom",
  /** @deprecated use app */
  shortName: SHARED_BRAND.app,
  /** @deprecated use full */
  displayName: SHARED_BRAND.full,
  /** @deprecated use legacyPrefixes */
  legacyPrefix: SHARED_BRAND.legacyPrefixes[0],
} as const;

export { APP_VERSION };

export function brandHeader(section: string): string {
  return `DEVROOM // ${section}`;
}

const KEYS = ["projects", "approvals", "knowledge", "priorities", "tasks", "data_version", "theme"] as const;

/** Migrate legacy jarvis_* and meridian_* localStorage keys to capdevroom_* */
export function migrateStorageKeys() {
  if (typeof window === "undefined") return;
  for (const legacy of BRAND.legacyPrefixes) {
    for (const k of KEYS) {
      const oldKey = legacy + k;
      const newKey = BRAND.storagePrefix + k;
      const val = localStorage.getItem(oldKey);
      if (val != null && localStorage.getItem(newKey) == null) {
        localStorage.setItem(newKey, val);
      }
    }
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(legacy + "briefing_")) {
        const neu = key.replace(legacy, BRAND.storagePrefix);
        if (!localStorage.getItem(neu)) localStorage.setItem(neu, localStorage.getItem(key)!);
      }
    });
  }
}

export function storageKey(name: (typeof KEYS)[number] | "briefing"): string {
  if (name === "briefing") return BRAND.storagePrefix + "briefing_";
  return BRAND.storagePrefix + name;
}
