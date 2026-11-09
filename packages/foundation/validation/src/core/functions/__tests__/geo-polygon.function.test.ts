/**
 * Stackra file contract:
 * Purpose: unit tests of the geospatial schemas (`geoPoint`, `geoLine`, `geoPolygon`): in-range points pass, an
 *          out-of-range latitude or longitude fails, a line needs two points and a polygon three.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0314; ADR 0022; STA-1432.
 */
import { describe, expect, it } from "@stackra/testing";

import { geoLine } from "#core/functions/geo-line.function";
import { geoPoint } from "#core/functions/geo-point.function";
import { geoPolygon } from "#core/functions/geo-polygon.function";

const A = { latitude: 24, longitude: 46 };
const B = { latitude: 24, longitude: 47 };
const C = { latitude: 25, longitude: 47 };

describe("geospatial schemas", () => {
  it("accepts a point in range and refuses one out of range", () => {
    expect(geoPoint().safeParse(A).success).toBe(true);
    expect(geoPoint().safeParse({ latitude: 91, longitude: 0 }).success).toBe(false);
    expect(geoPoint().safeParse({ latitude: 0, longitude: -181 }).success).toBe(false);
  });

  it("needs two points for a line and three for a polygon", () => {
    expect(geoLine().safeParse([A]).success).toBe(false);
    expect(geoLine().safeParse([A, B]).success).toBe(true);
    expect(geoPolygon().safeParse([A, B]).success).toBe(false);
    expect(geoPolygon().safeParse([A, B, C]).success).toBe(true);
  });
});
