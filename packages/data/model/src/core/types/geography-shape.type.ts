/**
 * Stackra file contract:
 * Purpose: `GeographyShape`, the PostGIS shape of a geography column: `Point`, `Polygon` or `LineString` (ADR 0314).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); STA-1432.
 */

/** The PostGIS shape of a geography column. */
export type GeographyShape = "Point" | "Polygon" | "LineString";
