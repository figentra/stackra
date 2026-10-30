/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/chip` (Chip).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Chip entry of the component registry. */
export const FREE_CHIP: ComponentEntry = {
  slug: "chip",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Chip",
  parts: ["Chip"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "chip",
      docsUrl: "https://www.heroui.com/docs/react/components/chip",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/chip",
    },
    native: {
      pkg: "heroui-native",
      slug: "chip",
      docsUrl: "https://www.heroui.com/docs/native/components/chip",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/chip",
    },
  },
  examples: [{ id: "matrix" }, { id: "icons", card: true }, { id: "context" }, { id: "live" }],
  related: ["free/card", "free/data-table", "free/bulk-action-bar"],
  tokens: ["color.surface", "radius.base", "color.border"],
  keywords: ["tag", "pill", "label"],
};
