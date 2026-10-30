/**
 * Stackra file contract:
 * Purpose: `byCategory`, the entries of one category (or all), optionally of one tier or platform, in listing order.
 * Boundary: a pure function over the registry.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 3.
 */
import type { ComponentCategory } from "#src/enums/component-category.enum";
import type { ComponentTier } from "#src/enums/component-tier.enum";
import type { Platform } from "#src/enums/platform.enum";
import { compareEntries } from "#src/registry/compare-entries.function";
import { COMPONENTS } from "#src/registry/components.generated";
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The entries in `category` (every category when undefined) that match the filters, in listing order. */
export function byCategory(
  category: ComponentCategory | undefined,
  filter: { readonly tier?: ComponentTier; readonly platform?: Platform } = {},
  entries: readonly ComponentEntry[] = COMPONENTS,
): ComponentEntry[] {
  return (
    entries
      .filter(
        (entry) =>
          (!category || entry.category === category) &&
          (!filter.tier || entry.tier === filter.tier) &&
          (!filter.platform || entry.platforms.includes(filter.platform)),
      )
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(compareEntries)
  );
}
