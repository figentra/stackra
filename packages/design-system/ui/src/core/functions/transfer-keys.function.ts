/**
 * Stackra file contract:
 * Purpose: `transferKeys(value, items, keys, to)`, a TransferList's chosen keys after moving `keys` into the chosen list
 *          (`chosen`) or back out of it (`available`), kept in the order the items are listed.
 * Boundary: pure; a key that names no item and a disabled item never move.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { SelectItem } from "#contracts/types/select-item.type";

/** The chosen keys after the move, in item order. */
export function transferKeys(
  value: readonly string[],
  items: readonly SelectItem[],
  keys: readonly string[],
  to: "chosen" | "available",
): readonly string[] {
  const chosen = new Set(value);
  for (const item of items) {
    if (item.isDisabled || !keys.includes(item.id)) continue;
    if (to === "chosen") chosen.add(item.id);
    else chosen.delete(item.id);
  }
  return items.filter((item) => chosen.has(item.id)).map((item) => item.id);
}
