/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/badge` (Badge).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Badge. */
export const FREE_BADGE: ComponentEntry = {
  slug: "badge",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Badge",
  parts: ["Badge", "Badge.Anchor"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "badge",
      docsUrl: "https://www.heroui.com/docs/react/components/badge",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/badge",
    },
  },
  examples: [
    { id: "variants", card: true },
    { id: "sizes" },
    { id: "corners" },
    { id: "dots" },
    { id: "content" },
    { id: "control" },
  ],
  related: ["free/avatar", "free/bulk-action-bar", "free/accordion"],
  tokens: ["color.surface", "radius.base", "color.border"],
  keywords: ["count", "dot", "notification", "indicator"],
};
