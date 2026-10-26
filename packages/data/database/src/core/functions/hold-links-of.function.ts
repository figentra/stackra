/**
 * Stackra file contract:
 * Purpose: `holdLinksOf`, the `HoldLinks` of some rows of a model: each row's primary key to the public ids its
 *          registered link fields hold.
 * Boundary: internal; reads `HOLD_LINK_FIELDS` and the rows as given. Undefined when the model declared no links, so a
 *           registry is asked exactly as before; an empty (null or absent) link is left out, and a row with none has
 *           no entry.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment); STA-1241.
 */
import { HOLD_LINK_FIELDS } from "#core/constants/hold-link-fields.constant";
import type { HoldLinks } from "#contracts/types/hold-links.type";

/**
 * The links of `rows`, keyed by each row's `key` field.
 *
 * @example
 * holdLinksOf(Order, [{ id: "ord_1", customerId: "per_7" }], "id"); // { ord_1: { customerId: "per_7" } }
 */
export function holdLinksOf(
  model: object,
  rows: readonly object[],
  key: string,
): HoldLinks | undefined {
  const fields = HOLD_LINK_FIELDS.get(model);
  if (fields === undefined) return undefined;
  const links: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    const record = row as Record<string, unknown>;
    const linked: Record<string, string> = {};
    for (const field of fields) {
      const value = record[field];
      if (value !== null && value !== undefined && value !== "") linked[field] = String(value);
    }
    if (Object.keys(linked).length > 0) links[String(record[key])] = linked;
  }
  return links;
}
