/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/menu` (Menu).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Menu. */
export const FREE_MENU: ComponentEntry = {
  slug: "menu",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Menu",
  parts: ["Menu"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "dropdown",
      docsUrl: "https://www.heroui.com/docs/react/components/dropdown",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/dropdown",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Menu.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "menu",
      docsUrl: "https://www.heroui.com/docs/native/components/menu",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/menu",
    },
  },
  examples: [
    { id: "basics", card: true },
    { id: "placement", platforms: ["react"] },
    { id: "selection", platforms: ["react"] },
    { id: "submenu" },
    { id: "states", platforms: ["react"] },
    { id: "live" },
    { id: "items", platforms: ["native"] },
    { id: "single", platforms: ["native"] },
    { id: "multiple", platforms: ["native"] },
    { id: "sheet", platforms: ["native"] },
  ],
  related: ["free/leave-confirmation", "free/modal", "free/popover"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  haptics: [{ event: "open", style: "impact" }],
  keywords: ["dropdown", "context", "options"],
};
