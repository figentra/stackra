/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/link` (Link).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Link entry of the component registry. */
export const FREE_LINK: ComponentEntry = {
  slug: "link",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Link",
  parts: ["Link"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "link",
      docsUrl: "https://www.heroui.com/docs/react/components/link",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/link",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Link.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "link-button",
      docsUrl: "https://www.heroui.com/docs/native/components/link-button",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/link-button",
    },
  },
  examples: [
    { id: "tones", card: true },
    { id: "running" },
    { id: "external" },
    { id: "router", platforms: ["react"] },
    { id: "states" },
    { id: "long" },
  ],
  related: ["free/cursor-pagination", "free/navigation-header", "free/breadcrumbs"],
  tokens: ["color.accent", "radius.field", "motion.duration"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["anchor", "href", "navigate"],
};
