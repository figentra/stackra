/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/breadcrumbs` (Breadcrumbs).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Breadcrumbs entry of the component registry. */
export const FREE_BREADCRUMBS: ComponentEntry = {
  slug: "breadcrumbs",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Breadcrumbs",
  parts: ["Breadcrumbs"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "breadcrumbs",
      docsUrl: "https://www.heroui.com/docs/react/components/breadcrumbs",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/breadcrumbs",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Breadcrumbs.html",
    },
  },
  examples: [
    { id: "trail", platforms: ["react"], card: true },
    { id: "lengths", platforms: ["react"] },
    { id: "separator", platforms: ["react"] },
    { id: "press", platforms: ["react"] },
    { id: "live" },
    { id: "arabic", platforms: ["react"] },
    { id: "basics", platforms: ["native"] },
    { id: "wrapping", platforms: ["native"] },
    { id: "single", platforms: ["native"] },
    { id: "named", platforms: ["native"] },
  ],
  related: ["free/cursor-pagination", "free/link", "free/navigation-header"],
  tokens: ["color.accent", "radius.field", "motion.duration"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["path", "trail", "navigation"],
};
