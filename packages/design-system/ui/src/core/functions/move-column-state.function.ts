/**
 * Stackra file contract:
 * Purpose: `moveColumnState()`, the column states with one column moved to a display index, for a header drag, the column editor or the keyboard.
 * Boundary: pure; an index past either end clamps, and an unknown id changes nothing.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionColumnState } from "#contracts/types/collection-column-state.type";

/**
 * The states with one moved.
 * @param states - the states in order
 * @param columnId - the column moved
 * @param toIndex - where it goes
 */
export function moveColumnState(
  states: readonly CollectionColumnState[],
  columnId: string,
  toIndex: number,
): readonly CollectionColumnState[] {
  const from = states.findIndex((state) => state.id === columnId);
  if (from < 0) return states;
  const moved = states[from] as CollectionColumnState;
  const rest = states.filter((_, index) => index !== from);
  const at = Math.min(Math.max(toIndex, 0), rest.length);
  return [...rest.slice(0, at), moved, ...rest.slice(at)];
}
