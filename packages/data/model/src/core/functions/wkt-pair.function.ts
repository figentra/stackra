/**
 * Stackra file contract:
 * Purpose: `wktPair`, one point as WKT coordinates: longitude, then latitude, space-separated.
 * Boundary: pure; used by the geography column types to write EWKT.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); STA-1432.
 */
import type { GeoPoint } from "@stackra/contracts";

/**
 * The WKT coordinates of `point`.
 *
 * @example
 * wktPair({ latitude: 24.5, longitude: 46.5 }); // "46.5 24.5"
 */
export function wktPair(point: GeoPoint): string {
  return `${point.longitude} ${point.latitude}`;
}
