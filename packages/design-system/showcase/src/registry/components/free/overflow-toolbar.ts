/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/overflow-toolbar` (Overflow toolbar).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; design-system gap inventory row 33.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Overflow toolbar entry of the component registry. */
export const FREE_OVERFLOW_TOOLBAR: ComponentEntry = {
  slug: "overflow-toolbar",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "OverflowToolbar",
  parts: ["OverflowToolbar"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "toolbar",
      docsUrl: "https://www.heroui.com/docs/react/components/toolbar",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/toolbar",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Toolbar.html",
    },
  },
  examples: [{ id: "basics", card: true }, { id: "narrow" }, { id: "live" }],
  related: ["free/action-menu", "free/button", "free/bulk-action-bar"],
  tokens: ["color.accent", "radius.field", "motion.duration"],
  keywords: ["toolbar", "overflow", "more actions", "responsive"],
};
