/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/icon` (Icon).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Icon entry of the component registry. */
export const FREE_ICON: ComponentEntry = {
  slug: "icon",
  tier: "free",
  category: "foundations",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Icon",
  parts: ["Icon"],
  hero: {},
  examples: [
    { id: "sizes" },
    { id: "tones" },
    { id: "names", card: true },
    { id: "rtl" },
    { id: "components", platforms: ["react"] },
    { id: "passthrough" },
    { id: "live" },
  ],
  related: ["free/foundations", "free/reveal", "free/typography"],
  tokens: ["color.accent", "color.background", "radius.base", "motion.duration"],
  keywords: ["icon", "glyph", "symbol"],
};
