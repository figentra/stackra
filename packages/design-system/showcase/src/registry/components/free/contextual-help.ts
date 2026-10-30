/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/contextual-help` (Contextual help).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; design-system gap inventory row 36.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Contextual help. */
export const FREE_CONTEXTUAL_HELP: ComponentEntry = {
  slug: "contextual-help",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ContextualHelp",
  parts: ["ContextualHelp"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "popover",
      docsUrl: "https://www.heroui.com/docs/react/components/popover",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/popover",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Popover.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "popover",
      docsUrl: "https://www.heroui.com/docs/native/components/popover",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/popover",
    },
  },
  examples: [{ id: "basics", card: true }, { id: "info" }, { id: "field" }],
  related: ["free/popover", "free/tooltip", "free/icon-button"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  keywords: ["help", "info", "question mark", "explain"],
};
