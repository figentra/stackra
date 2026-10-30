/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/section` (Section).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Section entry of the component registry. */
export const FREE_SECTION: ComponentEntry = {
  slug: "section",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Section",
  parts: ["Section"],
  hero: {},
  examples: [
    { id: "parts", platforms: ["react"], card: true },
    { id: "actions" },
    { id: "names", platforms: ["react"] },
    { id: "arabic", platforms: ["react"] },
    { id: "live", platforms: ["react"] },
    { id: "basics", platforms: ["native"] },
    { id: "slots", platforms: ["native"] },
    { id: "nested", platforms: ["native"] },
  ],
  related: ["free/screen", "free/separator", "free/page-header"],
  tokens: ["color.background", "color.surface", "spacing.page"],
  keywords: ["section", "block", "group"],
};
