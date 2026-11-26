/**
 * Stackra file contract:
 * Purpose: `withinMetresOf`, the `Where` condition "this geography column is within `metres` of the point"
 *          (`ST_DWithin`): the drivers near a pickup, the stores near a customer.
 * Boundary: builds a parameterised fragment for `Where.$raw`; the point travels as an EWKT parameter and the distance
 *           is metres on the WGS 84 spheroid. The column's GiST index serves it.
 * Runtime: node
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); ADR 0160 (decision 1); STA-1432.
 */
import type { RawQueryFragment } from "@mikro-orm/core";
import type { GeoPoint } from "@stackra/contracts";
import { GeoPointType } from "@stackra/model";

import { sql } from "#core/functions/sql.function";
import type { ColumnRef } from "#core/values/column-ref.value";

/**
 * The condition that the shape in `column` lies within `metres` of `point`.
 *
 * @throws RangeError for a distance that is negative or not finite.
 * @example
 * await this.find({ $raw: withinMetresOf(Drivers.columns.location, pickup, 2_000) });
 */
export function withinMetresOf(
  column: ColumnRef,
  point: GeoPoint,
  metres: number,
): RawQueryFragment {
  if (!Number.isFinite(metres) || metres < 0)
    throw new RangeError(`${metres} is not a distance in metres`);
  return sql`ST_DWithin(${column}, ${new GeoPointType().convertToDatabaseValue(point)}::geography, ${metres})`;
}
