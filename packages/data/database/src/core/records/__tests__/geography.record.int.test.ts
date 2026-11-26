/**
 * Stackra file contract:
 * Purpose: integration tests of the geospatial kit on a real PostGIS (the Stackra test image): `t.polygon` and
 *          `t.point` create geography columns with GiST indexes; values written as the ORM types' EWKT read back
 *          through `ST_AsGeoJSON` as the same shapes; `areaCovers`, `withinMetresOf` and `intersectsArea` select the
 *          right rows.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); ADR 0160; STA-1432.
 */
import type { GeoPoint, GeoPolygon } from "@stackra/contracts";
import { GeoPointType, GeoPolygonType } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { Migration } from "#core/bases/migration.base";
import { Extension } from "#core/enums/extension.enum";
import { areaCovers } from "#core/functions/area-covers.function";
import { compileMigration } from "#core/functions/compile-migration.function";
import { intersectsArea } from "#core/functions/intersects-area.function";
import { table } from "#core/functions/table.function";
import { withinMetresOf } from "#core/functions/within-metres-of.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { usePostgres } from "#testing/use-postgres";

class CreateZonesMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Postgis);
    schema.create("zones", (t: Blueprint) => {
      t.string("name").notNull().comment("The zone's name.");
      t.polygon("area").notNull().comment("The zone's outer ring.");
      t.point("depot").notNull().comment("Where its drivers start.");
    });
  }
}

const postgres = usePostgres({
  migrations: [compileMigration(CreateZonesMigration, { schema: "places", createsSchema: true })],
});

const Zones = table("places.zones", { area: "area", depot: "depot" });
const points = new GeoPointType();
const areas = new GeoPolygonType();

/** A square from `west`,`south` one degree each way. */
const square = (west: number, south: number): GeoPolygon => [
  { latitude: south, longitude: west },
  { latitude: south, longitude: west + 1 },
  { latitude: south + 1, longitude: west + 1 },
  { latitude: south + 1, longitude: west },
];

/** Runs `sql` with `params` in a transaction. */
const query = <T>(sql: string, params: readonly unknown[] = []) =>
  postgres.database.transaction(() => postgres.database.em().execute<T[]>(sql, [...params]));

/** Inserts a zone. */
const insert = (name: string, area: GeoPolygon, depot: GeoPoint) =>
  query("insert into places.zones (name, area, depot) values (?, ?::geography, ?::geography)", [
    name,
    areas.convertToDatabaseValue(area),
    points.convertToDatabaseValue(depot),
  ]);

/** The names of the zones matching `fragment`. */
const namesWhere = async (fragment: { sql: string; params: readonly unknown[] }) =>
  (
    await query<{ name: string }>(
      `select name from places.zones where ${fragment.sql} order by name`,
      fragment.params,
    )
  ).map((row) => row.name);

describe("geography kit on PostGIS", () => {
  it("indexes the columns with GiST and round-trips the shapes", async () => {
    await insert("riyadh", square(46, 24), { latitude: 24.5, longitude: 46.5 });
    await insert("dammam", square(49, 26), { latitude: 26.4, longitude: 50.1 });

    const indexes = await query<{ indexname: string; indexdef: string }>(
      "select indexname, indexdef from pg_indexes where schemaname = 'places' and tablename = 'zones' and indexdef like '%gist%' order by indexname",
    );
    expect(indexes.map((index) => index.indexname)).toEqual(["idx_zones_area", "idx_zones_depot"]);

    const [row] = await query<{ area: string; depot: string }>(
      `select ${areas.convertToJSValueSQL("area")} as area, ${points.convertToJSValueSQL("depot")} as depot from places.zones where name = 'riyadh'`,
    );
    expect(areas.convertToJSValue(row?.area)).toEqual(square(46, 24));
    expect(points.convertToJSValue(row?.depot)).toEqual({ latitude: 24.5, longitude: 46.5 });

    expect(
      await namesWhere(areaCovers(Zones.columns.area, { latitude: 24.2, longitude: 46.9 })),
    ).toEqual(["riyadh"]);
    expect(
      await namesWhere(areaCovers(Zones.columns.area, { latitude: 30, longitude: 30 })),
    ).toEqual([]);
    expect(
      await namesWhere(
        withinMetresOf(Zones.columns.depot, { latitude: 24.51, longitude: 46.5 }, 2000),
      ),
    ).toEqual(["riyadh"]);
    expect(await namesWhere(intersectsArea(Zones.columns.area, square(46.5, 24.5)))).toEqual([
      "riyadh",
    ]);
  });
});
