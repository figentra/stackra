/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/input-group` (Input group).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Input group entry of the component registry. */
export const FREE_INPUT_GROUP: ComponentEntry = {
  slug: "input-group",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "InputGroup",
  parts: ["InputGroup"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "input-group",
      docsUrl: "https://www.heroui.com/docs/react/components/input-group",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/input-group",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Group.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "input-group",
      docsUrl: "https://www.heroui.com/docs/native/components/input-group",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/input-group",
    },
  },
  examples: [
    { id: "variants", card: true },
    { id: "affixes" },
    { id: "elements" },
    { id: "states" },
    { id: "width" },
    { id: "live" },
  ],
  related: ["free/mode-switch", "free/form-section", "free/form-field"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [{ event: "invalid", style: "error" }],
  keywords: ["prefix", "suffix", "addon"],
};
