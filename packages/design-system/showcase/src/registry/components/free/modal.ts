/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/modal` (Modal).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Modal entry of the component registry. */
export const FREE_MODAL: ComponentEntry = {
  slug: "modal",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Modal",
  parts: ["Modal", "Modal.Close", "Modal.Title", "Modal.Section"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "modal",
      docsUrl: "https://www.heroui.com/docs/react/components/modal",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/modal",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Modal.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "dialog",
      docsUrl: "https://www.heroui.com/docs/native/components/dialog",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/dialog",
    },
  },
  examples: [
    { id: "sizes", card: true },
    { id: "position" },
    { id: "motion" },
    { id: "dismissal", platforms: ["react"] },
    { id: "long", platforms: ["react"] },
    { id: "live", platforms: ["react"] },
    { id: "basics", platforms: ["native"] },
    { id: "controlled", platforms: ["native"] },
    { id: "locked", platforms: ["native"] },
  ],
  related: ["free/menu", "free/popover", "free/leave-confirmation"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  haptics: [{ event: "open", style: "impact" }],
  keywords: ["dialog", "popup", "overlay"],
};
