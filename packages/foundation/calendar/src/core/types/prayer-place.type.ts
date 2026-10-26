/**
 * Stackra file contract:
 * Purpose: `PrayerPlace`, where prayer times are computed for: latitude and longitude in degrees, and the elevation
 *          that moves sunrise and sunset.
 * Boundary: a type only. A location's coordinates are tenant data (the branch address), never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0414 (decision 2).
 */

/** A point on Earth. */
export type PrayerPlace = {
  /** Degrees north, -90 to 90. */
  readonly latitude: number;
  /** Degrees east, -180 to 180. */
  readonly longitude: number;
  /** Metres above sea level; 0 when left out. */
  readonly elevation?: number;
};
