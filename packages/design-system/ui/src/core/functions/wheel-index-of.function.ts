/**
 * Stackra file contract:
 * Purpose: `wheelIndexOf(offset, rowHeight, items, from)`, the row a wheel settles on after scrolling to `offset`:
 *          the nearest row, clamped, moved to the nearest enabled row (towards `from` first).
 * Boundary: pure; -1 when every row is disabled.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { WheelPickerItem } from "#contracts/types/wheel-picker-item.type";

/**
 * The row a wheel settles on.
 * @param offset - the scroll offset in pixels
 * @param rowHeight - one row's height in pixels
 * @param items - the column's choices
 * @returns the index of the row
 */
export function wheelIndexOf(
  offset: number,
  rowHeight: number,
  items: readonly WheelPickerItem[],
): number {
  if (items.length === 0) return -1;
  const near = Math.min(items.length - 1, Math.max(0, Math.round(offset / Math.max(1, rowHeight))));
  for (let distance = 0; distance < items.length; distance += 1) {
    for (const index of [near - distance, near + distance]) {
      if (index >= 0 && index < items.length && !items[index]?.isDisabled) return index;
    }
  }
  return -1;
}
