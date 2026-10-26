/**
 * Stackra file contract:
 * Purpose: `textValueOf`: the text a row is typed ahead by and named with when no `label` is given.
 * Boundary: a pure function; no state, no I/O.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decisions
 *          7 and 10); ADR 0313 (text slots); ADR 0060 (RTL).
 */
import type { ListItemData } from "#contracts/types/list-item-data.type";

/** The text a row is typed ahead by and named with when no `label` is given: the title when it is text, else the id. */
export function textValueOf(item: ListItemData): string {
  if (item.label !== undefined) return item.label;
  return typeof item.title === "string" ? item.title : item.id;
}
