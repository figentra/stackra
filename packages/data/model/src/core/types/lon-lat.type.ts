/**
 * Stackra file contract:
 * Purpose: `LonLat`, one GeoJSON coordinate pair: longitude, then latitude (RFC 7946).
 * Boundary: a type only; read from `ST_AsGeoJSON` by the geography column types.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); STA-1432.
 */

/** Longitude, then latitude, in degrees. */
export type LonLat = readonly [number, number];
