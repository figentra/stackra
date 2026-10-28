/**
 * Stackra file contract:
 * Purpose: integration test of `usePostgres()`'s default image: every approved extension (`Extension`, ADR 0160 and
 *          PostGIS by ADR 0314) can be created, and a vector and a geography value round-trip.
 * Boundary: integration tier (`.int`): needs Docker; the first run builds the test image.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182; ADR 0269 (decision 3); ADR 0160; ADR 0314; gap db19 (stackra-284).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Extension } from "#core/enums/extension.enum";
import { usePostgres } from "#testing/use-postgres";

const postgres = usePostgres({ migrations: [] });

describe("usePostgres default image", () => {
  it("creates every approved extension", async () => {
    const em = postgres.database.em();
    for (const name of Enum.values(Extension))
      // raw-sql: the test checks the image can create each approved extension, which is DDL
      await em.execute(`create extension if not exists ${name}`);
    const rows = await em.execute<{ extname: string }[]>("select extname from pg_extension");
    expect(rows.map((row) => row.extname)).toEqual(
      expect.arrayContaining([...Enum.values(Extension)]),
    );
  });

  it("stores a vector and a geography point", async () => {
    const em = postgres.database.em();
    // raw-sql: the operators of the two extensions under test
    const [row] = await em.execute<{ distance: number; srid: number }[]>(
      "select '[1,2]'::vector <-> '[1,3]'::vector as distance, st_srid('SRID=4326;POINT(55.27 25.2)'::geography::geometry) as srid",
    );
    expect(row).toEqual({ distance: 1, srid: 4326 });
  });
});
