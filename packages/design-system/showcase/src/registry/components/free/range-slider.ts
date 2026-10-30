/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/range-slider` (Range slider).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Range slider. */
export const FREE_RANGE_SLIDER: ComponentEntry = {
  slug: "range-slider",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "RangeSlider",
  parts: ["RangeSlider"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "slider",
      docsUrl: "https://www.heroui.com/docs/react/components/slider",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/slider",
    },
  },
  examples: [{ id: "basics", card: true }],
  related: ["free/number-field"],
  tokens: ["color.accent"],
  keywords: ["range", "slider", "price", "filter"],
  status: "new",
};
