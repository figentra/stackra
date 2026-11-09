/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/color-swatch` (Colour swatch).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1981.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Colour swatch entry of the component registry. */
export const FREE_COLOR_SWATCH: ComponentEntry = {
  slug: "color-swatch",
  tier: "free",
  category: "data_display",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "ColorSwatch",
  parts: ["ColorSwatch"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "color-swatch",
      docsUrl: "https://www.heroui.com/docs/react/components/color-swatch",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/color-swatch",
    },
  },
  examples: [{ id: "basics", card: true }],
  related: ["free/color-field", "free/color-picker"],
  tokens: ["color.border"],
  keywords: ["colour", "color", "swatch", "preview"],
  status: "new",
};
