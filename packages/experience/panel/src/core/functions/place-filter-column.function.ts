/**
 * Stackra file contract:
 * Purpose: `placeFilterColumn(columns, id, label, look)`, a table filter placed among the collection columns: merged
 *          into the shown column of its key (now filterable), else added as a hidden column the filter bar offers.
 * Boundary: internal: pure apart from the array it fills; `label` is read only for an added column, since a missing
 *           catalogue key throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 9 and 11); ADR 0505.
 */
import type { CollectionColumn } from "@stackra/ui/contracts";

/**
 * Places the filter column `id` in `columns`.
 *
 * @example
 * placeFilterColumn(columns, "status", () => t(statusLabel), { type: "choice", options });
 */
export function placeFilterColumn(
  columns: CollectionColumn[],
  id: string,
  label: () => string,
  look: Partial<CollectionColumn>,
): void {
  const at = columns.findIndex((column) => column.id === id);
  const column = columns[at];
  if (column !== undefined) columns[at] = { ...column, ...look, isFilterable: true };
  else columns.push({ id, label: label(), isHidden: true, ...look });
}
