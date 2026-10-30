/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/card` (Card).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Card. */
export const FREE_CARD: ComponentEntry = {
  slug: "card",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Card",
  parts: ["Card", "Card.Title"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "card",
      docsUrl: "https://www.heroui.com/docs/react/components/card",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/card",
    },
    native: {
      pkg: "heroui-native",
      slug: "card",
      docsUrl: "https://www.heroui.com/docs/native/components/card",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/card",
    },
  },
  examples: [
    { id: "levels", card: true },
    { id: "anatomy" },
    { id: "title-levels" },
    { id: "named", platforms: ["react"] },
    { id: "horizontal", platforms: ["react"] },
    { id: "dismissible" },
  ],
  related: ["free/bulk-action-bar", "free/chip", "free/badge"],
  tokens: ["color.surface", "radius.base", "color.border"],
  keywords: ["container", "panel", "tile"],
};
