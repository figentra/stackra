/**
 * Stackra file contract:
 * Purpose: `wholeRows`, a grid's items padded with empty cells to whole rows, so the lone card of a last row keeps its
 *          column's width instead of stretching across the row.
 * Boundary: a pure function; the list renders an empty, flexible cell for each `undefined`.
 * Runtime: react-native
 * Governing contract: STA-1371 (listing by width, 2026-10-28).
 */

/** `items`, then `undefined` up to a multiple of `columns`. */
export function wholeRows<T>(items: readonly T[], columns: number): (T | undefined)[] {
  const missing = (columns - (items.length % columns)) % columns;
  return [...items, ...Array.from({ length: missing }, () => undefined)];
}
