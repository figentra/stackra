/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/flag` (Flag).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1981.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Flag entry of the component registry. */
export const FREE_FLAG: ComponentEntry = {
  slug: "flag",
  tier: "free",
  category: "foundations",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "Flag",
  parts: ["Flag"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/country-select", "free/phone-field", "free/locale-switcher"],
  tokens: ["color.muted"],
  keywords: ["flag", "country", "region", "emoji"],
  status: "new",
};
