/**
 * Stackra file contract:
 * Purpose: `jsonPath`, the `Where` condition "the value at this path of a jsonb column equals that value"
 *          (`jsonPath(Entries.columns.live, ["slug", locale], slug)`), so a nested read needs no cast of the model's
 *          filter type.
 * Boundary: builds a parameterised fragment for `Where.$raw`; each path key and the value are parameters (the keys as
 *           an `array[...]`, the value as JSON), compared as jsonb so a number, boolean or string matches its own type. `null` matches a JSON
 *           null and an absent path alike.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1: raw SQL parameterised); ADR 0097.
 */
import { raw } from "@mikro-orm/core";
import type { RawQueryFragment } from "@mikro-orm/core";

import type { JsonPathValue } from "#core/types/json-path-value.type";
import type { ColumnRef } from "#core/values/column-ref.value";

/**
 * The condition that the value at `path` of `column` equals `value`.
 *
 * @throws TypeError for an empty path or an empty key in it.
 * @example
 * await this.findOne({ $raw: jsonPath(Entries.columns.live, ["slug", "en"], "pricing") });
 */
export function jsonPath(
  column: ColumnRef,
  path: readonly string[],
  value: JsonPathValue,
): RawQueryFragment {
  if (path.length === 0 || path.some((key) => key === ""))
    throw new TypeError(`jsonPath needs a path of non-empty keys for ${column.name}`);
  const keys = path.map(() => "?").join(", ");
  // raw-sql: one placeholder per key, so no driver has to bind a JS array; coalesce makes an absent path match only null
  return raw<RawQueryFragment>(
    `coalesce(${column.toString()} #> array[${keys}]::text[], 'null'::jsonb) = ?::jsonb`,
    [...path, JSON.stringify(value)],
  );
}
