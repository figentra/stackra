/**
 * Stackra file contract:
 * Purpose: `GeoPoint`, a position on the WGS 84 ellipsoid in decimal degrees.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: OS-182 (geocoding); ADR 0305.
 */

/** A latitude and longitude. */
export interface GeoPoint {
  /** Degrees north, -90 to 90. */
  readonly latitude: number;

  /** Degrees east, -180 to 180. */
  readonly longitude: number;
}
