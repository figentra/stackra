/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/scroll-area` (Scroll area).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Scroll area entry of the component registry. */
export const FREE_SCROLL_AREA: ComponentEntry = {
  slug: "scroll-area",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ScrollArea",
  parts: ["ScrollArea"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "scroll-shadow",
      docsUrl: "https://www.heroui.com/docs/react/components/scroll-shadow",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/scroll-shadow",
    },
  },
  examples: [{ id: "terms", card: true }, { id: "chips" }, { id: "arabic", platforms: ["react"] }],
  related: ["free/carousel", "free/drawer", "free/surface"],
  tokens: ["color.background", "radius.container"],
  keywords: ["scroll area", "scroll shadow", "overflow", "fade", "scroller"],
  status: "new",
};
