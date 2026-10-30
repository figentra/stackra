/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/avatar-group` (Avatar group).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; design-system gap inventory row 25.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Avatar group. */
export const FREE_AVATAR_GROUP: ComponentEntry = {
  slug: "avatar-group",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "AvatarGroup",
  parts: ["AvatarGroup"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "avatar-group",
      docsUrl: "https://www.heroui.com/docs/react/components/avatar-group",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/avatar-group",
    },
  },
  examples: [{ id: "overflow", card: true }, { id: "sizes" }, { id: "shift" }],
  related: ["free/avatar", "free/badge", "free/list"],
  tokens: ["color.background", "radius.full", "motion.fast"],
  haptics: [{ event: "press", style: "impact" }],
  keywords: ["avatars", "people", "team", "assignees", "stack"],
};
