/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/button-group` (Button group).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Button group entry of the component registry. */
export const FREE_BUTTON_GROUP: ComponentEntry = {
  slug: "button-group",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ButtonGroup",
  parts: ["ButtonGroup"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "button-group",
      docsUrl: "https://www.heroui.com/docs/react/components/button-group",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/button-group",
    },
  },
  examples: [
    { id: "period", card: true },
    { id: "actions" },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/button", "free/split-button", "free/segmented-control"],
  tokens: ["radius.control", "color.default"],
  keywords: ["button group", "attached buttons", "toolbar", "segmented", "split"],
  status: "new",
};
