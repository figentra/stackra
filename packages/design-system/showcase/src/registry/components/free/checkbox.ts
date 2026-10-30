/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/checkbox` (Checkbox).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Checkbox entry of the component registry. */
export const FREE_CHECKBOX: ComponentEntry = {
  slug: "checkbox",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Checkbox",
  parts: ["Checkbox"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "checkbox",
      docsUrl: "https://www.heroui.com/docs/react/components/checkbox",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/checkbox",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Checkbox.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "checkbox",
      docsUrl: "https://www.heroui.com/docs/native/components/checkbox",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/checkbox",
    },
  },
  examples: [{ id: "states" }, { id: "variants", card: true }, { id: "unnamed" }, { id: "live" }],
  related: ["free/checkbox-group", "free/combo-box", "free/entity-picker"],
  tokens: ["color.accent", "radius.field", "color.focus"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["check", "toggle", "tick"],
};
