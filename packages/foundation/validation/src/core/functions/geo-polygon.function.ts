/**
 * Stackra file contract:
 * Purpose: `geoPolygon()`, the schema generated code writes for a field typed `GeoPolygon`: an outer ring of three or
 *          more points, first point not repeated at the end.
 * Boundary: a zod array of `geoPoint()` typed as the contracts `GeoPolygon`. Authored code never calls it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0314; STA-1432.
 */
import type { GeoPolygon } from "@stackra/contracts";
import { z } from "zod";
import type { ZodType } from "zod";

import { geoPoint } from "#core/functions/geo-point.function";

/**
 * A new schema of an area's outer ring.
 *
 * @example
 * export const Zone$ = z.object({ area: geoPolygon() });
 */
export function geoPolygon(): ZodType<GeoPolygon, GeoPolygon> {
  return z.array(geoPoint()).min(3);
}
