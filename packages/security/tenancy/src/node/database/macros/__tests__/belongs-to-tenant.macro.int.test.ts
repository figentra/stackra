/**
 * Stackra file contract:
 * Purpose: integration tests of the expand form of `BelongsToTenantMacro` against `assertRowSecurity`: a table under
 *          an ancestor `scope_path` policy that `t.belongsToTenant({ expand: true })` gave a nullable `tenant_id`
 *          (the shape of #657) fails the hard checks, now that every package table has its contract step; so does a
 *          nullable `tenant_id` without the `scope_path` policy.
 * Boundary: test only; integration tier (Docker through `usePostgres`). Each test restores what it changes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0347 (decisions 1 and 5).
 */
import { compileMigration, Extension, Migration } from "@stackra/database";
import type { Blueprint, SchemaBuilder } from "@stackra/database";
import { assertRowSecurity, usePostgres } from "@stackra/database/testing";
import { describe, expect, it } from "@stackra/testing";

import { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";
import { tenantIsolationOptions } from "#testing/functions/tenant-isolation-options.function";

/** A scope-path table, as the 22 package tables were before #657. */
class CreateFoldersMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("folders", (t: Blueprint) => {
      t.hasPublicId("fld");
      t.scopePath().notNull().comment("The folder's scope path.");
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}

/** The expand step of #657: the nullable tenant column and no policy. */
class ExpandFoldersMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.table("folders", (t: Blueprint) => {
      t.belongsToTenant({ expand: true });
    });
  }
}

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateFoldersMigration, {
      schema: "docs",
      createsSchema: true,
      macros: [BelongsToTenantMacro],
    }),
    compileMigration(ExpandFoldersMigration, { schema: "docs", macros: [BelongsToTenantMacro] }),
  ],
});

describe("BelongsToTenantMacro expand step under assertRowSecurity", () => {
  it("takes the hard checks: every package table is contracted, so none is staged as a warning", async () => {
    const audit = assertRowSecurity(postgres.database, {
      ...tenantIsolationOptions(),
      strict: false,
    });
    await expect(audit).rejects.toThrow(/docs\.folders has no policy pol_folders_tenant_id/);
    await expect(audit).rejects.toThrow(
      /docs\.folders: pol_folders_scope_path is a second permissive policy/,
    );
  });

  it("keeps the hard checks for a nullable tenant_id without the scope_path policy", async () => {
    const em = postgres.database.em();
    await em.execute(
      'create table "docs"."loose" ("id" varchar(33) primary key, "tenant_id" varchar(33))',
    );
    await em.execute('alter table "docs"."loose" enable row level security');
    try {
      await expect(
        assertRowSecurity(postgres.database, { ...tenantIsolationOptions(), strict: false }),
      ).rejects.toThrow(/docs\.loose has no policy pol_loose_tenant_id/);
    } finally {
      await em.execute('drop table "docs"."loose"');
    }
  });
});
