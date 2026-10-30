/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/close-button` (Close button).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Close button. */
export const FREE_CLOSE_BUTTON: ComponentEntry = {
  slug: "close-button",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "CloseButton",
  parts: ["CloseButton"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "close-button",
      docsUrl: "https://www.heroui.com/docs/react/components/close-button",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/close-button",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Button.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "close-button",
      docsUrl: "https://www.heroui.com/docs/native/components/close-button",
      sourceUrl:
        "https://github.com/heroui-inc/heroui-native/tree/main/src/components/close-button",
    },
  },
  examples: [{ id: "forms" }, { id: "use", card: true }],
  related: ["free/button", "free/icon-button"],
  tokens: ["color.accent", "radius.field", "motion.press"],
  haptics: [{ event: "press", style: "impact" }],
  keywords: ["dismiss", "close", "x"],
};
