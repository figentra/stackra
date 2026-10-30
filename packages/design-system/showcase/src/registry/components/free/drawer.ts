/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/drawer` (Drawer).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Drawer entry of the component registry. */
export const FREE_DRAWER: ComponentEntry = {
  slug: "drawer",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Drawer",
  parts: [
    "Drawer",
    "Drawer.Header",
    "Drawer.Back",
    "Drawer.Title",
    "Drawer.Description",
    "Drawer.Close",
    "Drawer.SubHeader",
    "Drawer.Body",
    "Drawer.Footer",
  ],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "drawer",
      docsUrl: "https://www.heroui.com/docs/react/components/drawer",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/drawer",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Modal.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "bottom-sheet",
      docsUrl: "https://www.heroui.com/docs/native/components/bottom-sheet",
      sourceUrl:
        "https://github.com/heroui-inc/heroui-native/tree/main/src/components/bottom-sheet",
    },
  },
  examples: [
    { id: "basic", card: true },
    { id: "sizes" },
    { id: "sub-header" },
    { id: "stepper" },
    { id: "stacked" },
    { id: "views" },
    { id: "placement" },
    { id: "dismissal", platforms: ["react"] },
    { id: "close-button", platforms: ["react"] },
    { id: "long", platforms: ["react"] },
    { id: "live", platforms: ["react"] },
    { id: "snap" },
    { id: "resize", platforms: ["native"] },
    { id: "basics", platforms: ["native"] },
    { id: "controlled", platforms: ["native"] },
    { id: "locked", platforms: ["native"] },
    { id: "form", platforms: ["native"] },
  ],
  related: ["free/alert-dialog", "free/action-menu", "free/leave-confirmation"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  haptics: [{ event: "open", style: "impact" }],
  keywords: ["side panel", "sheet", "slide over", "stacked drawer", "drill-down", "wizard"],
};
