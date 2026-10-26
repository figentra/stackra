/**
 * Stackra file contract:
 * Purpose: `jsonContains`, the `Where` condition "this jsonb column contains that value" (`@>`): an array column holding
 *          an element (`jsonContains(Bookings.columns.resourceIds, [resourceId])`) or an object column holding a
 *          sub-object (`jsonContains(Entries.columns.fields, { color: "red" })`).
 * Boundary: builds a parameterised fragment for `Where.$raw`; the value is serialised to one JSON parameter, never
 *           written into the text. A GIN index on the column (`jsonb_ops` or `jsonb_path_ops`) serves it.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1: raw SQL parameterised); ADR 0097.
 */
import type { RawQueryFragment } from "@mikro-orm/core";

import { sql } from "#core/functions/sql.function";
import type { ColumnRef } from "#core/values/column-ref.value";

/**
 * The condition that `column` contains `value`.
 *
 * @throws TypeError for a value JSON cannot hold (`undefined`, a function).
 * @example
 * await this.find({ $raw: jsonContains(Bookings.columns.resourceIds, [resourceId]) });
 */
export function jsonContains(column: ColumnRef, value: unknown): RawQueryFragment {
  const json = JSON.stringify(value) as string | undefined;
  if (json === undefined) throw new TypeError(`jsonContains needs a JSON value for ${column.name}`);
  return sql`${column} @> ${json}::jsonb`;
}
