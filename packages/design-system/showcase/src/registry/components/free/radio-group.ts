/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/radio-group` (Radio group).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Radio group. */
export const FREE_RADIO_GROUP: ComponentEntry = {
  slug: "radio-group",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "RadioGroup",
  parts: ["RadioGroup"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "radio-group",
      docsUrl: "https://www.heroui.com/docs/react/components/radio-group",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/radio-group",
      racUrl: "https://react-spectrum.adobe.com/react-aria/RadioGroup.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "radio-group",
      docsUrl: "https://www.heroui.com/docs/native/components/radio-group",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/radio-group",
    },
  },
  examples: [{ id: "layouts", card: true }, { id: "states" }, { id: "variants" }, { id: "live" }],
  related: ["free/select", "free/entity-picker", "free/switch"],
  tokens: ["color.accent", "radius.field", "color.focus"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["radio", "single choice", "options"],
};
