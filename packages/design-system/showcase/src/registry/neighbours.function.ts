/**
 * Stackra file contract:
 * Purpose: `neighbours`, the previous and next entries of an entry within its category on one platform (the page pager).
 * Boundary: a pure function over the registry.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 4.
 */
import type { Platform } from "#src/enums/platform.enum";
import { byCategory } from "#src/registry/by-category.function";
import { COMPONENTS } from "#src/registry/components.generated";
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The entries before and after `entry` in its category, among those shown on `platform`. */
export function neighbours(
  entry: Pick<ComponentEntry, "tier" | "slug" | "category">,
  platform: Platform,
  entries: readonly ComponentEntry[] = COMPONENTS,
): { readonly previous?: ComponentEntry; readonly next?: ComponentEntry } {
  const list = byCategory(entry.category, { platform }, entries);
  const index = list.findIndex((item) => item.tier === entry.tier && item.slug === entry.slug);
  if (index < 0) return {};
  const previous = list[index - 1];
  const next = list[index + 1];
  return { ...(previous ? { previous } : {}), ...(next ? { next } : {}) };
}
