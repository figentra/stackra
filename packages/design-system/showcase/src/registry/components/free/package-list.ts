/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/package-list` (PackageList).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-2041 (the Stackra landing, W4).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The PackageList entry of the component registry. */
export const FREE_PACKAGE_LIST: ComponentEntry = {
  slug: "package-list",
  tier: "free",
  category: "data_display",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "PackageList",
  parts: ["PackageList"],
  // HeroUI has no package list; a plain list on theme tokens.
  hero: {},
  examples: [{ id: "packages", card: true }],
  related: ["free/list", "free/code", "free/bento-card"],
  tokens: ["font.mono", "color.muted", "color.separator"],
  keywords: ["packages", "npm", "dependencies", "module list", "library list"],
  status: "new",
};
