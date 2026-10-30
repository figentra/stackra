/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/pagination` (Pagination).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Pagination entry of the component registry. */
export const FREE_PAGINATION: ComponentEntry = {
  slug: "pagination",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Pagination",
  parts: ["Pagination"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "pagination",
      docsUrl: "https://www.heroui.com/docs/react/components/pagination",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/pagination",
    },
  },
  examples: [{ id: "basics", card: true }, { id: "sizes" }, { id: "arabic", platforms: ["react"] }],
  related: ["free/cursor-pagination", "free/data-table", "free/table"],
  tokens: ["color.accent-soft", "color.accent-soft-foreground", "radius.control"],
  keywords: ["pagination", "pages", "page size", "jump", "next", "previous", "table"],
  status: "new",
};
