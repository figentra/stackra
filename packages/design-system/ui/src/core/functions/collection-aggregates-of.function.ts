/**
 * Stackra file contract:
 * Purpose: `collectionAggregatesOf()`, the footer aggregates of a set of rows, by column id.
 * Boundary: pure; `aggregateOf` computes each one.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { AggregateKind } from "#contracts/enums/aggregate-kind.enum";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import { aggregateOf } from "#core/functions/aggregate-of.function";

/**
 * The aggregates of the rows.
 * @param items - the rows
 * @param aggregates - the aggregate of each column
 */
export function collectionAggregatesOf(
  items: readonly CollectionItem[],
  aggregates: Readonly<Record<string, AggregateKind>>,
): Readonly<Record<string, number | null>> {
  const out: Record<string, number | null> = {};
  for (const [id, kind] of Object.entries(aggregates))
    out[id] = aggregateOf(
      items.map((item) => (item as unknown as Readonly<Record<string, unknown>>)[id]),
      kind,
    );
  return out;
}
