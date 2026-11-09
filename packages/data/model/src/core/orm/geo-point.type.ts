/**
 * Stackra file contract:
 * Purpose: `GeoPointType`, the ORM column type of a `GeoPoint` field: `geography(Point,4326)` (ADR 0314). Gen's entity
 *          metadata writes `{ type: GeoPointType }` for each `GeoPoint` field of a model.
 * Boundary: a MikroORM custom type over `GeographyType`; no behaviour of its own beyond the shape mapping.
 * Runtime: node
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); STA-1432.
 */
import type { GeoPoint } from "@stackra/contracts";

import { pointOf } from "#core/functions/point-of.function";
import { wktPair } from "#core/functions/wkt-pair.function";
import { GeographyType } from "#core/orm/geography.type";
import type { LonLat } from "#core/types/lon-lat.type";

/**
 * The column type of a point.
 *
 * @example
 * location: { type: GeoPointType },
 */
export class GeoPointType extends GeographyType<GeoPoint> {
  /** A PostGIS `Point`. */
  protected readonly shape = "Point";

  /** The point as well-known text, `POINT(lon lat)`, the form PostGIS reads. */
  protected wkt(value: GeoPoint): string {
    return `POINT(${wktPair(value)})`;
  }

  /** GeoJSON `[lon, lat]` to the point. */
  protected fromCoordinates(coordinates: unknown): GeoPoint {
    return pointOf(coordinates as LonLat);
  }
}
