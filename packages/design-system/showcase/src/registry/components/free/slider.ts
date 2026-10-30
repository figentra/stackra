/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/slider` (Slider).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Slider entry of the component registry. */
export const FREE_SLIDER: ComponentEntry = {
  slug: "slider",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Slider",
  parts: ["Slider"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "slider",
      docsUrl: "https://www.heroui.com/docs/react/components/slider",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/slider",
    },
  },
  examples: [
    { id: "basics", card: true },
    { id: "input" },
    { id: "vertical" },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/range-slider", "free/number-field", "free/meter"],
  tokens: ["color.accent", "color.separator", "radius.control"],
  keywords: ["slider", "value", "volume", "discount", "budget", "marks", "vertical"],
  status: "new",
};
