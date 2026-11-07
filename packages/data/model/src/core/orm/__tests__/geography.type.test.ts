/**
 * Stackra file contract:
 * Purpose: unit tests of the geography column types: each writes EWKT in WGS 84 (a polygon's ring closed), reads
 *          the GeoJSON `ST_AsGeoJSON` returns back to the same shape (the closing point dropped), wraps the column in
 *          `ST_AsGeoJSON`, names its `geography(<shape>,4326)` column, passes null through and refuses WKB text.
 * Boundary: test only; no database (the PostGIS integration test in @stackra/database runs them).
 * Runtime: node (vitest)
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); ADR 0022; STA-1432.
 */
import { describe, expect, it } from "@stackra/testing";

import { GeoLineType } from "#core/orm/geo-line.type";
import { GeoPointType } from "#core/orm/geo-point.type";
import { GeoPolygonType } from "#core/orm/geo-polygon.type";

const DOOR = { latitude: 24.5, longitude: 46.5 };
const TRIANGLE = [
  { latitude: 24, longitude: 46 },
  { latitude: 24, longitude: 47 },
  { latitude: 25, longitude: 47 },
];

describe("geography column types", () => {
  it("writes and reads a point", () => {
    const type = new GeoPointType();
    expect(type.convertToDatabaseValue(DOOR)).toBe("SRID=4326;POINT(46.5 24.5)");
    expect(type.convertToJSValue('{"type":"Point","coordinates":[46.5,24.5]}')).toEqual(DOOR);
    expect(type.convertToJSValueSQL('"location"')).toBe('ST_AsGeoJSON("location")');
    expect(type.getColumnType()).toBe("geography(Point,4326)");
  });

  it("closes a polygon's ring on the way in and drops the closing point on the way out", () => {
    const type = new GeoPolygonType();
    expect(type.convertToDatabaseValue(TRIANGLE)).toBe(
      "SRID=4326;POLYGON((46 24, 47 24, 47 25, 46 24))",
    );
    expect(
      type.convertToJSValue('{"type":"Polygon","coordinates":[[[46,24],[47,24],[47,25],[46,24]]]}'),
    ).toEqual(TRIANGLE);
    expect(type.getColumnType()).toBe("geography(Polygon,4326)");
  });

  it("writes and reads a line in order", () => {
    const type = new GeoLineType();
    expect(type.convertToDatabaseValue(TRIANGLE)).toBe("SRID=4326;LINESTRING(46 24, 47 24, 47 25)");
    expect(
      type.convertToJSValue('{"type":"LineString","coordinates":[[46,24],[47,24],[47,25]]}'),
    ).toEqual(TRIANGLE);
    expect(type.getColumnType()).toBe("geography(LineString,4326)");
  });

  it("passes null through and refuses WKB a raw query returned", () => {
    const type = new GeoPointType();
    expect(type.convertToDatabaseValue(null)).toBeNull();
    expect(type.convertToJSValue(undefined)).toBeUndefined();
    expect(() => type.convertToJSValue("0101000020E6100000")).toThrow(/ST_AsGeoJSON/);
  });
});
