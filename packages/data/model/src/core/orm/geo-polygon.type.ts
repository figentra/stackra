/**
 * Stackra file contract:
 * Purpose: `GeoPolygonType`, the ORM column type of a `GeoPolygon` field: `geography(Polygon,4326)` (ADR 0314).
 * Boundary: a MikroORM custom type over `GeographyType`. The model holds the outer ring with the first point not
 *           repeated; the column holds it closed, as WKT requires. Interior rings read back are dropped (the
 *           `GeoPolygon` shape has none).
 * Runtime: node
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); STA-1432.
 */
import type { GeoPolygon } from "@stackra/contracts";

import { pointOf } from "#core/functions/point-of.function";
import { wktPair } from "#core/functions/wkt-pair.function";
import { GeographyType } from "#core/orm/geography.type";
import type { LonLat } from "#core/types/lon-lat.type";

/**
 * The column type of an area.
 *
 * @example
 * area: { type: GeoPolygonType },
 */
export class GeoPolygonType extends GeographyType<GeoPolygon> {
  /** A PostGIS `Polygon`. */
  protected readonly shape = "Polygon";

  /** `POLYGON((lon lat, …, first))`: the ring closed back to its first point. */
  protected wkt(value: GeoPolygon): string {
    const first = value[0];
    const ring = first === undefined ? value : [...value, first];
    return `POLYGON((${ring.map(wktPair).join(", ")}))`;
  }

  /** GeoJSON `[[[lon, lat], …]]` to the outer ring, without its closing point. */
  protected fromCoordinates(coordinates: unknown): GeoPolygon {
    const outer = (coordinates as LonLat[][])[0] ?? [];
    return outer.slice(0, -1).map(pointOf);
  }
}
