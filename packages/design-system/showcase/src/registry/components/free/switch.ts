/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/switch` (Switch).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Switch. */
export const FREE_SWITCH: ComponentEntry = {
  slug: "switch",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Switch",
  parts: ["Switch"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "switch",
      docsUrl: "https://www.heroui.com/docs/react/components/switch",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/switch",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Switch.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "switch",
      docsUrl: "https://www.heroui.com/docs/native/components/switch",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/switch",
    },
  },
  examples: [{ id: "states" }, { id: "unnamed" }, { id: "live", card: true }],
  related: ["free/select", "free/tag-group", "free/radio-group"],
  tokens: ["color.accent", "radius.field", "color.focus"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["toggle", "on off", "setting"],
};
