/**
 * Stackra file contract:
 * Purpose: `compareEntries`, the listing order of entries: category order, then free before Pro, then slug A-Z.
 * Boundary: a pure comparator.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 3.
 */
import { ComponentCategory } from "#src/enums/component-category.enum";
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Sorts entries by category order, then free before Pro, then slug. */
export function compareEntries(
  a: Pick<ComponentEntry, "category" | "tier" | "slug">,
  b: Pick<ComponentEntry, "category" | "tier" | "slug">,
): number {
  return (
    ComponentCategory.indexOf(a.category) - ComponentCategory.indexOf(b.category) ||
    (a.tier === b.tier ? 0 : a.tier === "free" ? -1 : 1) ||
    a.slug.localeCompare(b.slug)
  );
}
