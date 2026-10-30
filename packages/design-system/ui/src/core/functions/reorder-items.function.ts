/**
 * Stackra file contract:
 * Purpose: `reorderItems(items, keys, targetId, position)`, the list after a drop: the rows whose ids are in `keys`
 *          lifted out, in their order, and put back before or after the target row. The web `SortableList`'s drop.
 * Boundary: pure; a target that is one of the moved rows, or not in the list, returns the list unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); design-system gap inventory (2026-10-28) row 10.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";

/**
 * Moves the rows in `keys` next to the target row.
 *
 * @example
 * reorderItems(rows, new Set(["a"]), "c", "after"); // b, c, a
 */
export function reorderItems<T extends CollectionItem>(
  items: readonly T[],
  keys: ReadonlySet<unknown>,
  targetId: unknown,
  position: "before" | "after" | "on",
): readonly T[] {
  const moving = items.filter((item) => keys.has(item.id));
  const rest = items.filter((item) => !keys.has(item.id));
  const at = rest.findIndex((item) => item.id === targetId);
  if (at < 0) return items;
  const index = position === "after" ? at + 1 : at;
  return [...rest.slice(0, index), ...moving, ...rest.slice(index)];
}
