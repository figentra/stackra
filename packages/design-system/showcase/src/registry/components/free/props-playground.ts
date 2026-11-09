/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/props-playground` (PropsPlayground).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-2041 (the Stackra landing, W4).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The PropsPlayground entry of the component registry. */
export const FREE_PROPS_PLAYGROUND: ComponentEntry = {
  slug: "props-playground",
  tier: "free",
  category: "foundations",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "PropsPlayground",
  parts: ["PropsPlayground"],
  // HeroUI has no props playground; it composes the kit's own fields.
  hero: {},
  examples: [{ id: "button", card: true }],
  related: ["free/segmented-control", "free/switch", "free/select"],
  tokens: ["color.surface", "color.border", "radius.lg"],
  keywords: [
    "playground",
    "props",
    "controls",
    "live preview",
    "theme switch",
    "rtl preview",
    "storybook",
  ],
  status: "new",
};
