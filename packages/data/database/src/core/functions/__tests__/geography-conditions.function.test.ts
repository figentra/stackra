/**
 * Stackra file contract:
 * Purpose: unit tests of the geospatial `Where` conditions (`areaCovers`, `withinMetresOf`, `intersectsArea`): each
 *          wraps the column in its `ST_` function with the shape as one EWKT geography parameter, and refuses a bad
 *          distance or an area of fewer than three points.
 * Boundary: test only; inspects the MikroORM fragments, runs no query (the PostGIS integration test runs them).
 * Runtime: node (vitest)
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); ADR 0022; ADR 0269; STA-1432.
 */
import { describe, expect, it } from "@stackra/testing";

import { areaCovers } from "#core/functions/area-covers.function";
import { intersectsArea } from "#core/functions/intersects-area.function";
import { table } from "#core/functions/table.function";
import { withinMetresOf } from "#core/functions/within-metres-of.function";

const Zones = table("places.zones", { area: "area", location: "location" });
const DOOR = { latitude: 24.5, longitude: 46.5 };
const SQUARE = [
  { latitude: 24, longitude: 46 },
  { latitude: 24, longitude: 47 },
  { latitude: 25, longitude: 47 },
  { latitude: 25, longitude: 46 },
];

describe("geography conditions", () => {
  it("binds the point of areaCovers as one EWKT parameter", () => {
    const fragment = areaCovers(Zones.columns.area, DOOR);
    expect(fragment.sql).toBe('ST_Covers("area", ?::geography)');
    expect(fragment.params).toEqual(["SRID=4326;POINT(46.5 24.5)"]);
  });

  it("binds the point and the metres of withinMetresOf, and refuses a bad distance", () => {
    const fragment = withinMetresOf(Zones.columns.location, DOOR, 2000);
    expect(fragment.sql).toBe('ST_DWithin("location", ?::geography, ?)');
    expect(fragment.params).toEqual(["SRID=4326;POINT(46.5 24.5)", 2000]);
    expect(() => withinMetresOf(Zones.columns.location, DOOR, -1)).toThrow(RangeError);
    expect(() => withinMetresOf(Zones.columns.location, DOOR, Number.NaN)).toThrow(RangeError);
  });

  it("binds the closed ring of intersectsArea, and refuses fewer than three points", () => {
    const fragment = intersectsArea(Zones.columns.area, SQUARE);
    expect(fragment.sql).toBe('ST_Intersects("area", ?::geography)');
    expect(fragment.params).toEqual(["SRID=4326;POLYGON((46 24, 47 24, 47 25, 46 25, 46 24))"]);
    expect(() => intersectsArea(Zones.columns.area, SQUARE.slice(0, 2))).toThrow(RangeError);
  });
});
