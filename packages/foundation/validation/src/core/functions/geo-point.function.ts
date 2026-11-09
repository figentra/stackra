/**
 * Stackra file contract:
 * Purpose: `geoPoint()`, the schema generated code writes for a field typed `GeoPoint`: `{ latitude, longitude }` in
 *          WGS 84 degrees, each in range.
 * Boundary: a zod object typed as the contracts `GeoPoint`. Authored code never calls it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the shape compiler maps platform types); ADR 0314; STA-1432.
 */
import type { GeoPoint } from "@stackra/contracts";
import { z } from "zod";
import type { ZodType } from "zod";

/**
 * A new schema of one point.
 *
 * @example
 * export const Depot$ = z.object({ location: geoPoint() });
 */
export function geoPoint(): ZodType<GeoPoint, GeoPoint> {
  return z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  });
}
