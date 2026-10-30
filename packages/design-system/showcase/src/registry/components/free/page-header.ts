/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/page-header` (Page header).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Page header. */
export const FREE_PAGE_HEADER: ComponentEntry = {
  slug: "page-header",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PageHeader",
  parts: ["PageHeader"],
  hero: {},
  examples: [
    { id: "parts", platforms: ["react"], card: true },
    { id: "actions" },
    { id: "arabic", platforms: ["react"] },
    { id: "live", platforms: ["react"] },
    { id: "basics", platforms: ["native"] },
    { id: "trail", platforms: ["native"] },
    { id: "slots", platforms: ["native"] },
  ],
  related: ["free/app-shell", "free/screen", "free/app-header"],
  tokens: ["color.background", "color.surface", "spacing.page"],
  keywords: ["title", "header", "actions"],
};
