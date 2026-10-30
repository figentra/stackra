/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tag-group` (Tag group).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tag group entry of the component registry. */
export const FREE_TAG_GROUP: ComponentEntry = {
  slug: "tag-group",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TagGroup",
  parts: ["TagGroup"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "tag-group",
      docsUrl: "https://www.heroui.com/docs/react/components/tag-group",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/tag-group",
      racUrl: "https://react-spectrum.adobe.com/react-aria/TagGroup.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "tag-group",
      docsUrl: "https://www.heroui.com/docs/native/components/tag-group",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/tag-group",
    },
  },
  examples: [
    { id: "basics", card: true },
    { id: "sizes" },
    { id: "selection" },
    { id: "states" },
    { id: "live" },
  ],
  related: ["free/switch", "free/select", "free/radio-group"],
  tokens: ["color.accent", "radius.field", "color.focus"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["tags", "chips", "labels"],
};
