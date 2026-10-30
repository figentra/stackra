/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/popover` (Popover).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Popover entry of the component registry. */
export const FREE_POPOVER: ComponentEntry = {
  slug: "popover",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Popover",
  parts: ["Popover"],
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
  examples: [
    { id: "placement", card: true },
    { id: "alignment" },
    { id: "content", platforms: ["react"] },
    { id: "dismissal", platforms: ["react"] },
    { id: "live", platforms: ["react"] },
    { id: "reposition", platforms: ["react"] },
    { id: "basics", platforms: ["native"] },
    { id: "arrow", platforms: ["native"] },
    { id: "controlled", platforms: ["native"] },
    { id: "locked", platforms: ["native"] },
  ],
  related: ["free/modal", "free/route-overlay", "free/menu"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  haptics: [{ event: "open", style: "impact" }],
  keywords: ["floating", "overlay", "bubble"],
};
