---
"@stackra/contracts": minor
"@stackra/validation": minor
"@stackra/model": minor
"@stackra/database": minor
"@stackra/gen": minor
---

The geospatial field kit on PostGIS (ADR 0314, STA-1432):

- `@stackra/contracts`: the `GeoPolygon` and `GeoLine` types beside `GeoPoint`.
- `@stackra/validation`: the `geoPoint()`, `geoPolygon()` and `geoLine()` schemas.
- `@stackra/model`: the `GeoPointType`, `GeoPolygonType` and `GeoLineType` column types (EWKT in, `ST_AsGeoJSON` out).
- `@stackra/database`: `t.point()`, `t.polygon()` and `t.line()` with default GiST indexes, the `areaCovers`,
  `withinMetresOf` and `intersectsArea` conditions, the `HasLocation` trait, and PostGIS in the PGlite memory driver
  and `db diff` when a member installs `@electric-sql/pglite-postgis`.
- `@stackra/gen`: the `geo` kind, mapped to `geography(<shape>,4326)` columns, entity column types and the schemas.
