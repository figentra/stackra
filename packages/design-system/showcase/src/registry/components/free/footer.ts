/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/footer` (Footer).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Footer entry of the component registry. */
export const FREE_FOOTER: ComponentEntry = {
  slug: "footer",
  tier: "free",
  category: "layout",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "Footer",
  parts: ["Footer"],
  // Composes Link, Grid and Cluster; web only, an app's footer is its tab bar.
  hero: {},
  examples: [{ id: "storefront", card: true }, { id: "minimal" }],
  related: ["free/link", "free/layout", "free/locale-switcher"],
  tokens: ["color.border", "spacing.page"],
  keywords: ["footer", "site footer", "links", "copyright", "legal", "sitemap"],
  status: "new",
};
