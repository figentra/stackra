/**
 * Stackra file contract:
 * Purpose: integration tests of the compiled equality policies on a real Postgres, in both public-id modes: a
 *          `link` tenant column (`varchar(33)`, or `uuid` with `publicIds: "uuid"`) under `equals` and `equalsOrUnset`,
 *          read by an unprivileged role with `app.tenant_id` set to a public id (`scp_…`, as `withTenant` writes it).
 *          Each tenant sees only its rows, an unset tenant sees none (or only the NULL rows), and under `uuid` the
 *          policy decodes the public id to the stored UUID, the same one `publicIdToUuid` gives, and still takes a raw
 *          UUID.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the container's superuser writes the rows and
 *           an unprivileged role reads them, because a superuser bypasses row-level security.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (decision 1); ADR 0135 (2026-10-28 amendment: native `uuid` storage); ADR 0182.
 */
import { publicIdToUuid } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { Migration } from "#core/bases/migration.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { usePostgres } from "#testing/use-postgres";

/** Two tenants; the second encodes the all-ones UUID, so both 64-bit halves decode through a negative bigint. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_7zzzzzzzzzzzzzzzzzzzzzzzzz";

class CreateOrdersMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("orders", (t: Blueprint) => {
      t.link("tenant_id").notNull().comment("The owning tenant.");
      t.string("body").notNull().comment("The order's text.");
      t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "equals" });
    });
    schema.create("notices", (t: Blueprint) => {
      t.link("tenant_id").nullable().comment("The owning tenant, or NULL for a platform row.");
      t.string("body").notNull().comment("The notice's text.");
      t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "equalsOrUnset" });
    });
  }
}

const MODES = [
  { schema: "text_ids", publicIds: "varchar", stored: (id: string) => id },
  { schema: "uuid_ids", publicIds: "uuid", stored: publicIdToUuid },
] as const;

const postgres = usePostgres({
  migrations: [
    ...MODES.map(({ schema, publicIds }) =>
      compileMigration(CreateOrdersMigration, { schema, createsSchema: true, publicIds }),
    ),
    {
      after: [],
      steps: [
        {
          transactional: true,
          inverse: false,
          sql: [
            "create role tenant_reader nologin",
            ...MODES.flatMap(({ schema, stored }) => [
              `grant usage on schema ${schema} to tenant_reader`,
              `grant select on all tables in schema ${schema} to tenant_reader`,
              `insert into ${schema}.orders values ('${stored(ACME)}', 'a'), ('${stored(GLOBEX)}', 'g')`,
              `insert into ${schema}.notices values ('${stored(ACME)}', 'a'), (null, 'p')`,
            ]),
          ],
        },
      ],
    },
  ],
});

/** The bodies of `table` the unprivileged role sees with `app.tenant_id` set to `setting`. */
function bodiesAs(setting: string, table: string): Promise<readonly string[]> {
  const { database } = postgres;
  return database.transaction(async () => {
    const em = database.em();
    await em.execute("select set_config('app.tenant_id', ?, true)", [setting]);
    await em.execute("set local role tenant_reader");
    const rows = (await em.execute(`select body from ${table} order by body`)) as {
      body: string;
    }[];
    return rows.map((row) => row.body);
  });
}

describe("BlueprintRecord equality policies", () => {
  for (const { schema, publicIds } of MODES)
    describe(`publicIds: ${publicIds}`, () => {
      it("shows each tenant only its rows, and an unset tenant none", async () => {
        expect(await bodiesAs(ACME, `${schema}.orders`)).toEqual(["a"]);
        expect(await bodiesAs(GLOBEX, `${schema}.orders`)).toEqual(["g"]);
        expect(await bodiesAs("", `${schema}.orders`)).toEqual([]);
      });

      it("shows an unset tenant only the NULL rows under equalsOrUnset", async () => {
        expect(await bodiesAs(ACME, `${schema}.notices`)).toEqual(["a"]);
        expect(await bodiesAs(GLOBEX, `${schema}.notices`)).toEqual([]);
        expect(await bodiesAs("", `${schema}.notices`)).toEqual(["p"]);
      });
    });

  it("takes a raw UUID setting on a uuid column", async () => {
    expect(await bodiesAs(publicIdToUuid(ACME), "uuid_ids.orders")).toEqual(["a"]);
  });
});
