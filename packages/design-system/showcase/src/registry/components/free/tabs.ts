/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tabs` (Tabs).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tabs entry of the component registry. */
export const FREE_TABS: ComponentEntry = {
  slug: "tabs",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Tabs",
  parts: ["Tabs"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "tabs",
      docsUrl: "https://www.heroui.com/docs/react/components/tabs",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/tabs",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Tabs.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "tabs",
      docsUrl: "https://www.heroui.com/docs/native/components/tabs",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/tabs",
    },
  },
  examples: [
    { id: "basics", card: true },
    { id: "variants" },
    { id: "orientation", platforms: ["react"] },
    { id: "states" },
    { id: "empty" },
    { id: "closable" },
    { id: "overflow", platforms: ["react"] },
    { id: "live" },
  ],
  related: ["free/sidebar", "free/navigation-list", "free/navigation-header"],
  tokens: ["color.accent", "radius.field", "motion.duration"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["tabs", "segments", "views", "closable tabs", "overflow", "more menu"],
};
