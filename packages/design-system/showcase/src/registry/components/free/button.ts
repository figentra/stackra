/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/button` (Button).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Button. */
export const FREE_BUTTON: ComponentEntry = {
  slug: "button",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Button",
  parts: ["Button"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "button",
      docsUrl: "https://www.heroui.com/docs/react/components/button",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/button",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Button.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "button",
      docsUrl: "https://www.heroui.com/docs/native/components/button",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/button",
    },
  },
  examples: [
    { id: "variants" },
    { id: "states" },
    { id: "icons", card: true },
    { id: "full-width" },
    { id: "live" },
  ],
  related: ["free/close-button", "free/icon-button"],
  tokens: ["color.accent", "radius.field", "motion.press"],
  haptics: [{ event: "press", style: "impact" }],
  keywords: ["action", "press", "submit", "cta"],
};
