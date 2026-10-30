/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/bidi` (Bidi).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Bidi entry of the component registry. */
export const FREE_BIDI: ComponentEntry = {
  slug: "bidi",
  tier: "free",
  category: "foundations",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Bidi",
  parts: ["Bidi", "useDirection"],
  hero: {},
  examples: [
    { id: "mixed-text", card: true },
    { id: "local-direction" },
    { id: "directional-motion" },
  ],
  related: ["free/foundations", "free/visually-hidden", "free/reveal"],
  tokens: ["motion.duration"],
  keywords: ["rtl", "direction", "bidi", "isolate"],
};
