/**
 * Stackra file contract:
 * Purpose: `GeoLineType`, the ORM column type of a `GeoLine` field: `geography(LineString,4326)` (ADR 0314).
 * Boundary: a MikroORM custom type over `GeographyType`; no behaviour of its own beyond the shape mapping.
 * Runtime: node
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); STA-1432.
 */
import type { GeoLine } from "@stackra/contracts";

import { pointOf } from "#core/functions/point-of.function";
import { wktPair } from "#core/functions/wkt-pair.function";
import { GeographyType } from "#core/orm/geography.type";
import type { LonLat } from "#core/types/lon-lat.type";

/**
 * The column type of a line.
 *
 * @example
 * route: { type: GeoLineType },
 */
export class GeoLineType extends GeographyType<GeoLine> {
  /** A PostGIS `LineString`. */
  protected readonly shape = "LineString";

  /** `LINESTRING(lon lat, …)`. */
  protected wkt(value: GeoLine): string {
    return `LINESTRING(${value.map(wktPair).join(", ")})`;
  }

  /** GeoJSON `[[lon, lat], …]` to the points. */
  protected fromCoordinates(coordinates: unknown): GeoLine {
    return (coordinates as LonLat[]).map(pointOf);
  }
}
