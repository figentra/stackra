/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/avatar` (Avatar).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Avatar. */
export const FREE_AVATAR: ComponentEntry = {
  slug: "avatar",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Avatar",
  parts: ["Avatar"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "avatar",
      docsUrl: "https://www.heroui.com/docs/react/components/avatar",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/avatar",
    },
    native: {
      pkg: "heroui-native",
      slug: "avatar",
      docsUrl: "https://www.heroui.com/docs/native/components/avatar",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/avatar",
    },
  },
  examples: [
    { id: "sizes", card: true },
    { id: "tones" },
    { id: "fallbacks" },
    { id: "names" },
    { id: "name" },
    { id: "live" },
  ],
  related: ["free/accordion", "free/badge", "free/bulk-action-bar"],
  tokens: ["color.surface", "radius.base", "color.border"],
  keywords: ["profile", "user", "initials", "picture"],
};
