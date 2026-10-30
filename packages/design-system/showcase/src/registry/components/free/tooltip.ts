/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tooltip` (Tooltip).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tooltip entry of the component registry. */
export const FREE_TOOLTIP: ComponentEntry = {
  slug: "tooltip",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Tooltip",
  parts: ["Tooltip"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "tooltip",
      docsUrl: "https://www.heroui.com/docs/react/components/tooltip",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/tooltip",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Tooltip.html",
    },
  },
  examples: [
    { id: "placement", platforms: ["react"], card: true },
    { id: "alignment", platforms: ["react"] },
    { id: "arrow", platforms: ["react"] },
    { id: "icons", platforms: ["react"] },
    { id: "delay", platforms: ["react"] },
    { id: "live" },
    { id: "basics", platforms: ["native"] },
    { id: "icon", platforms: ["native"] },
    { id: "own", platforms: ["native"] },
  ],
  related: ["free/route-overlay", "free/use-confirmation", "free/popover"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  haptics: [{ event: "open", style: "impact" }],
  keywords: ["hint", "help", "hover"],
};
