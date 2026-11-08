/**
 * Stackra file contract:
 * Purpose: `pointOf`, a GeoJSON coordinate pair to a `GeoPoint`.
 * Boundary: pure; used by the geography column types to read `ST_AsGeoJSON`.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); STA-1432.
 */
import type { GeoPoint } from "@stackra/contracts";

import type { LonLat } from "#core/types/lon-lat.type";

/**
 * The point of a GeoJSON pair.
 *
 * @example
 * pointOf([46.5, 24.5]); // { latitude: 24.5, longitude: 46.5 }
 */
export function pointOf([longitude, latitude]: LonLat): GeoPoint {
  return { latitude, longitude };
}
