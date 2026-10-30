/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/surface` (Surface).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Surface. */
export const FREE_SURFACE: ComponentEntry = {
  slug: "surface",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Surface",
  parts: ["Surface"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "surface",
      docsUrl: "https://www.heroui.com/docs/react/components/surface",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/surface",
    },
    native: {
      pkg: "heroui-native",
      slug: "surface",
      docsUrl: "https://www.heroui.com/docs/native/components/surface",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/surface",
    },
  },
  examples: [{ id: "levels", card: true }, { id: "nested" }, { id: "text" }, { id: "live" }],
  related: ["free/single-column-layout", "free/two-column-layout", "free/separator"],
  tokens: ["color.background", "color.surface", "spacing.page"],
  keywords: ["background", "layer", "material"],
};
