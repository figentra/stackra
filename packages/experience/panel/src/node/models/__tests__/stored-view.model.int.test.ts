/**
 * Stackra file contract:
 * Purpose: integration test of `StoredView` through the ORM on Postgres: `sharing` and `layout` are
 *          `@Field(z.enum([...]))` hatches on `t.enum()` columns (`text` with a check constraint), and gen types them
 *          from those columns, so a write stores the bare `private` and `table` (never the JSON-encoded `"private"`,
 *          which the check constraint refuses) and a read gives them back.
 * Boundary: test only; integration tier (Docker through `usePostgres`, or the Testbed's `--postgres`). It runs the
 *           package's own migration 0001 and its committed entity list.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0159 (the migration owns the column type).
 */
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { ViewLayout } from "#core/enums/view-layout.enum";
import { ViewSharing } from "#core/enums/view-sharing.enum";
import { CreateStoredViewsMigration } from "#node/database/migrations/0001-create-stored-views.migration";
import { PANEL_ENTITIES } from "#node/entities.gen";
import { StoredView } from "#node/models/stored-view.model";

const postgres = usePostgres({
  entities: [...PANEL_ENTITIES],
  migrations: [
    compileMigration(CreateStoredViewsMigration, {
      schema: "panel",
      createsSchema: true,
      macros: [BelongsToTenantMacro],
    }),
  ],
});

describe("StoredView on Postgres", () => {
  it("writes sharing and layout as their bare strings and reads them back", async () => {
    const { database } = postgres;
    await database.transaction(async () => {
      const em = database.em();
      em.persist(
        em.create(StoredView, {
          id: "view_01ja0000000000000000000001",
          tenantId: "ten_01ja0000000000000000000001",
          resource: "orders.order",
          name: "Mine",
          owner: "usr_01ja0000000000000000000001",
          sharing: ViewSharing.Private,
          role: null,
          layout: ViewLayout.Table,
          layoutBy: null,
          filter: {},
          sort: null,
          columns: null,
          group: null,
          totals: [],
        } as never),
      );
      await em.flush();
    });

    const stored = await database
      .em()
      .getConnection()
      .execute<{ sharing: string; layout: string }[]>(
        "select sharing, layout from panel.stored_views where id = ?",
        ["view_01ja0000000000000000000001"],
      );
    expect(stored[0]).toEqual({ sharing: "private", layout: "table" });

    const read = await database
      .em()
      .fork()
      .findOneOrFail(StoredView, { id: "view_01ja0000000000000000000001" } as never);
    expect(read.sharing).toBe("private");
    expect(read.layout).toBe("table");
  });
});
