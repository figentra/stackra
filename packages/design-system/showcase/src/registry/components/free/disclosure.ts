/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/disclosure` (Disclosure).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave C).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Disclosure entry of the component registry. */
export const FREE_DISCLOSURE: ComponentEntry = {
  slug: "disclosure",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Disclosure",
  parts: ["Disclosure"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "disclosure",
      docsUrl: "https://www.heroui.com/docs/react/components/disclosure",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/disclosure",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Disclosure.html",
    },
  },
  examples: [{ id: "basics", card: true }, { id: "states" }],
  related: ["free/accordion", "free/drawer", "free/popover"],
  tokens: ["color.foreground", "color.muted", "motion.duration"],
  keywords: ["disclosure", "show more", "collapse", "expand", "details"],
  status: "new",
};
