/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/split-button` (Split button).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; design-system gap inventory row 34.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Split button. */
export const FREE_SPLIT_BUTTON: ComponentEntry = {
  slug: "split-button",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SplitButton",
  parts: ["SplitButton"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "button-group",
      docsUrl: "https://www.heroui.com/docs/react/components/button-group",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/button-group",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Menu.html",
    },
  },
  examples: [{ id: "basics", card: true }, { id: "variants" }, { id: "states" }],
  related: ["free/button", "free/action-menu", "free/menu"],
  tokens: ["color.accent", "radius.field", "motion.duration"],
  keywords: ["save", "dropdown button", "caret", "menu button"],
};
