/**
 * Stackra file contract:
 * Purpose: `categoryPath`, the web path of a category tab: `/components/<kebab id>`; `/components` is All.
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.2.
 */
import type { ComponentCategory } from "#src/enums/component-category.enum";

/** The web path of `category` ("/components/inputs-and-forms"), or of All when undefined. */
export function categoryPath(category?: ComponentCategory): string {
  return category ? `/components/${category.replaceAll("_", "-")}` : "/components";
}
