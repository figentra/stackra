/**
 * Stackra file contract:
 * Purpose: `areaCovers`, the `Where` condition "this `GeoPolygon` column covers the point" (`ST_Covers`): the delivery
 *          zones a customer's door is in (`areaCovers(Zones.columns.area, door)`).
 * Boundary: builds a parameterised fragment for `Where.$raw`; the point travels as an EWKT parameter. The column's
 *           GiST index (`t.polygon`) serves it. A point on the edge counts as covered.
 * Runtime: node
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); ADR 0160 (decision 1); STA-1432.
 */
import type { RawQueryFragment } from "@mikro-orm/core";
import type { GeoPoint } from "@stackra/contracts";
import { GeoPointType } from "@stackra/model";

import { sql } from "#core/functions/sql.function";
import type { ColumnRef } from "#core/values/column-ref.value";

/**
 * The condition that the area in `column` covers `point`.
 *
 * @example
 * await this.find({ $raw: areaCovers(Zones.columns.area, { latitude: 24.71, longitude: 46.67 }) });
 */
export function areaCovers(column: ColumnRef, point: GeoPoint): RawQueryFragment {
  return sql`ST_Covers(${column}, ${new GeoPointType().convertToDatabaseValue(point)}::geography)`;
}
