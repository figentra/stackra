/**
 * Stackra file contract:
 * Purpose: `GeoPoint`, the one point on the earth: latitude and longitude in WGS 84 decimal degrees. A rules geo
 *          fact, a shipping stop or depot, and a geocoder's answer all use it.
 * Boundary: a type only. Distances, geocoding and routing belong to their packages (rules, i18n, shipping); a model's
 *           location column (ADR 0314) maps to this shape at its boundary. Personal data when it is a customer's door.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 3: geo operators); OS-182 (geocoding); R3-SO-09 (routing ports); STA-1383
 *                     (one home for duplicated value types).
 */

/**
 * A point in decimal degrees.
 *
 * @example
 * const depot: GeoPoint = { latitude: 24.7136, longitude: 46.6753 };
 */
export interface GeoPoint {
  /** Degrees north of the equator, from -90 to 90. */
  readonly latitude: number;

  /** Degrees east of Greenwich, from -180 to 180. */
  readonly longitude: number;
}
