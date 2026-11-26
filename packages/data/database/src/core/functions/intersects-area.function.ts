/**
 * Stackra file contract:
 * Purpose: `intersectsArea`, the `Where` condition "this geography column touches or crosses the area"
 *          (`ST_Intersects`): the zones that overlap a new zone, the routes through a district.
 * Boundary: builds a parameterised fragment for `Where.$raw`; the area travels as an EWKT parameter. The column's
 *           GiST index serves it.
 * Runtime: node
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); ADR 0160 (decision 1); STA-1432.
 */
import type { RawQueryFragment } from "@mikro-orm/core";
import type { GeoPolygon } from "@stackra/contracts";
import { GeoPolygonType } from "@stackra/model";

import { sql } from "#core/functions/sql.function";
import type { ColumnRef } from "#core/values/column-ref.value";

/**
 * The condition that the shape in `column` intersects `area`.
 *
 * @throws RangeError for an area of fewer than three points.
 * @example
 * await this.count({ $raw: intersectsArea(Zones.columns.area, draft.area) });
 */
export function intersectsArea(column: ColumnRef, area: GeoPolygon): RawQueryFragment {
  if (area.length < 3) throw new RangeError("an area needs at least three points");
  return sql`ST_Intersects(${column}, ${new GeoPolygonType().convertToDatabaseValue(area)}::geography)`;
}
