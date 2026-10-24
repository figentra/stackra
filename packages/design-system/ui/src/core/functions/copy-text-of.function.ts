/**
 * Stackra file contract:
 * Purpose: the text a PropertyList row's copy button copies, or nothing when the row has no copy button: a row is
 *          copyable only with a `copyLabel` (the button's name) and a text, which is `copyValue` or a string or number
 *          value.
 * Boundary: pure; internal, not in the `.` barrel. Web and native decide from the same function, so a row is copyable
 *           on both or on neither.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decisions 1 and 7).
 */
import type { PropertyListItem } from "#contracts/types/property-list-item.type";

/**
 * Gives the text to copy for a row.
 * @param item - the row: only its `value`, `copyLabel` and `copyValue` are read
 * @returns the text, or undefined when the row is not copyable
 */
export function copyTextOf(
  item: Pick<PropertyListItem, "value" | "copyLabel" | "copyValue">,
): string | undefined {
  if (item.copyLabel === undefined || item.copyLabel === "") return undefined;
  const { value } = item;
  const text =
    item.copyValue ?? (typeof value === "string" || typeof value === "number" ? String(value) : "");
  return text === "" ? undefined : text;
}
