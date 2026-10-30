/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/typography` (Typography).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Typography entry of the component registry. */
export const FREE_TYPOGRAPHY: ComponentEntry = {
  slug: "typography",
  tier: "free",
  category: "foundations",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Text",
  parts: ["Text"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "text",
      docsUrl: "https://www.heroui.com/docs/react/components/text",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/text",
    },
    native: {
      pkg: "heroui-native",
      slug: "text",
      docsUrl: "https://www.heroui.com/docs/native/components/text",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/text",
    },
  },
  examples: [
    { id: "text", card: true },
    { id: "heading-types" },
    { id: "heading-levels" },
    { id: "tones" },
    { id: "alignment" },
    { id: "truncation" },
    { id: "weight", platforms: ["react"] },
    { id: "language" },
    { id: "inline" },
    { id: "live" },
  ],
  related: ["free/reveal", "free/icon", "free/foundations"],
  tokens: ["color.accent", "color.background", "radius.base", "motion.duration"],
  keywords: ["text", "heading", "font"],
};
