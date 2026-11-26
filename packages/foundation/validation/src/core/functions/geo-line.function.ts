/**
 * Stackra file contract:
 * Purpose: `geoLine()`, the schema generated code writes for a field typed `GeoLine`: two or more points in order.
 * Boundary: a zod array of `geoPoint()` typed as the contracts `GeoLine`. Authored code never calls it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0314; STA-1432.
 */
import type { GeoLine } from "@stackra/contracts";
import { z } from "zod";
import type { ZodType } from "zod";

import { geoPoint } from "#core/functions/geo-point.function";

/**
 * A new schema of a line.
 *
 * @example
 * export const Route$ = z.object({ path: geoLine() });
 */
export function geoLine(): ZodType<GeoLine, GeoLine> {
  return z.array(geoPoint()).min(2);
}
