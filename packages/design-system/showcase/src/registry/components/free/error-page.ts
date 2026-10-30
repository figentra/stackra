/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/error-page` (Error page): the 403, 404, 500 and offline presets on ErrorState.
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; GAPS.md row 31.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Error page entry of the component registry. */
export const FREE_ERROR_PAGE: ComponentEntry = {
  slug: "error-page",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ErrorPage",
  parts: ["ErrorPage"],
  hero: {},
  examples: [{ id: "presets", card: true }, { id: "retry" }, { id: "custom" }],
  related: ["free/error-state", "free/empty-state", "free/page-skeleton"],
  tokens: ["color.danger", "color.muted", "radius.base"],
  keywords: ["404", "403", "500", "offline", "not found", "forbidden"],
};
