/**
 * Stackra file contract:
 * Purpose: `resolveCollectionColumns()`, the columns with the user's state applied (name, width, pin, wrap, hidden) in display order: pinned start, then the rest, then pinned end, each in the state's order.
 * Boundary: pure; a column the state does not know keeps its definition and goes after the known ones. The row header can never be hidden.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionColumnState } from "#contracts/types/collection-column-state.type";
import type { ResolvedCollectionColumn } from "#contracts/types/resolved-collection-column.type";

/**
 * The columns as drawn.
 * @param columns - the definitions
 * @param states - the user's states, in order
 */
export function resolveCollectionColumns(
  columns: readonly CollectionColumn[],
  states: readonly CollectionColumnState[],
): readonly ResolvedCollectionColumn[] {
  const rowHeaderId = (columns.find((column) => column.isRowHeader) ?? columns[0])?.id;
  const byId = new Map(columns.map((column) => [column.id, column]));
  const known = states.filter((state) => byId.has(state.id));
  const ids = [
    ...known.map((state) => state.id),
    ...columns.map((column) => column.id).filter((id) => !known.some((state) => state.id === id)),
  ];
  const stateOf = new Map(known.map((state) => [state.id, state]));
  const resolved = ids.map((id): ResolvedCollectionColumn => {
    const column = byId.get(id) as CollectionColumn;
    const state = stateOf.get(id);
    const canHide = id !== rowHeaderId && column.isHideable !== false;
    const pin = state?.pin === null ? undefined : (state?.pin ?? column.pin);
    return {
      ...column,
      defaultLabel: column.label,
      label: state?.label?.trim() ? state.label : column.label,
      width: state?.width ?? column.width,
      pin,
      wrap: state?.wrap ?? column.wrap,
      isHidden: canHide && (state?.isHidden ?? column.isHidden ?? false),
      canHide,
    };
  });
  return [
    ...resolved.filter((column) => column.pin === "start"),
    ...resolved.filter((column) => column.pin === undefined),
    ...resolved.filter((column) => column.pin === "end"),
  ];
}
