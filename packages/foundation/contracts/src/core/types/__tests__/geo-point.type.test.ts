/**
 * Stackra file contract:
 * Purpose: type tests of `GeoPoint`: latitude and longitude are required and read-only, and the short `lat`/`lng`
 *          spelling is refused.
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`) plus runtime checks of the same values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); STA-1383.
 */
import { describe, expect, it } from "@stackra/testing";

import type { GeoPoint } from "#core/types/geo-point.type";

describe("GeoPoint", () => {
  it("takes latitude and longitude", () => {
    const point: GeoPoint = { latitude: 25.2, longitude: 55.27 };
    expect(point.latitude).toBe(25.2);
  });

  it("refuses the short spelling and writes", () => {
    // @ts-expect-error -- the fields are latitude and longitude
    const short: GeoPoint = { lat: 25.2, lng: 55.27 };
    const point: GeoPoint = { latitude: 1, longitude: 2 };
    // @ts-expect-error -- read-only
    point.latitude = 3;
    expect(short).toBeDefined();
  });
});
