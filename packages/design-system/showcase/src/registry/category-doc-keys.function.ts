/**
 * Stackra file contract:
 * Purpose: `categoryDocKeys`, the `showcase::doc.category.<id>.*` hero and pillar keys of a category page.
 * Boundary: a pure function; every key is required in both locales (the gate checks them).
 * Runtime: isomorphic
 * Governing contract: STA-1371 (doc pages wave, 2026-10-28).
 */
import type { ComponentCategory } from "#src/enums/component-category.enum";
import { CATEGORY_DOC_FIELDS } from "#src/registry/category-doc-fields.constant";

/** The hero and pillar keys of `category`. */
export function categoryDocKeys(
  category: ComponentCategory,
): Record<(typeof CATEGORY_DOC_FIELDS)[number], string> {
  return Object.fromEntries(
    CATEGORY_DOC_FIELDS.map((field) => [field, `showcase::doc.category.${category}.${field}`]),
  ) as Record<(typeof CATEGORY_DOC_FIELDS)[number], string>;
}
