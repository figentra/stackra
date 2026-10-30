/**
 * Stackra file contract:
 * Purpose: `dataViewFieldsOf()`, the columns a list row or a card shows, from the app's `DataViewFields` and the
 *          visible columns: the title (the row header unless named), the subtitle (the next visible column), the meta and
 *          the fields (the other visible columns, in display order).
 * Boundary: pure; a named column that is unknown is dropped.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); STA-1371.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataViewFields } from "#contracts/types/data-view-fields.type";
import type { ResolvedCollectionColumn } from "#contracts/types/resolved-collection-column.type";

/** The columns of each slot. */
interface ResolvedFields {
  readonly title: ResolvedCollectionColumn | undefined;
  readonly subtitle: ResolvedCollectionColumn | undefined;
  readonly meta: ResolvedCollectionColumn | undefined;
  readonly fields: readonly ResolvedCollectionColumn[];
}

/**
 * The columns of a row's slots.
 * @param given - what the app named
 * @param columns - the visible columns, in display order
 */
export function dataViewFieldsOf<TItem extends CollectionItem>(
  given: DataViewFields<TItem> | undefined,
  columns: readonly ResolvedCollectionColumn[],
): ResolvedFields {
  const byId = (id: string | undefined) =>
    id === undefined ? undefined : columns.find((column) => column.id === id);
  const title = byId(given?.title) ?? columns.find((column) => column.isRowHeader) ?? columns[0];
  const subtitle =
    given?.subtitle === undefined
      ? columns.find((column) => column !== title && column.id !== given?.meta)
      : byId(given.subtitle);
  const meta = byId(given?.meta);
  const taken = new Set([title?.id, subtitle?.id, meta?.id]);
  const fields = given?.fields
    ? given.fields.flatMap((id) => byId(id) ?? [])
    : columns.filter((column) => !taken.has(column.id));
  return { title, subtitle, meta, fields };
}
