/**
 * Stackra file contract:
 * Purpose: `CollectionGroup`, the rows sharing one value of the group-by column, with their aggregates.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";

/** One group of rows. */
export interface CollectionGroup<TItem extends CollectionItem = CollectionItem> {
  /** The value the rows share, as text. */
  readonly key: string;
  /** The rows, in order. */
  readonly items: readonly TItem[];
  /** The aggregates of the group, by column id. */
  readonly aggregates: Readonly<Record<string, number | null>>;
}
