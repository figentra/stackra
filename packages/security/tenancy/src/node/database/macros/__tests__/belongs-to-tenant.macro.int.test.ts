/**
 * Stackra file contract:
 * Purpose: integration tests of the expand form of `BelongsToTenantMacro` against `assertRowSecurity`: a table under
 *          an ancestor `scope_path` policy that `t.belongsToTenant({ expand: true })` gave a nullable `tenant_id`
 *          (the shape of #657) is a group (a) warning until 0.20 and a gap in strict mode; the same table with a
 *          NOT NULL `tenant_id`, or a nullable `tenant_id` without the `scope_path` policy, fails the hard checks.
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

const EXPAND =
  /^docs\.folders holds a nullable tenant_id with no pol_folders_tenant_id policy \(\(a\) ancestor scope_path table in the expand step, awaiting backfill and the contract step\)$/;

describe("BelongsToTenantMacro expand step under assertRowSecurity", () => {
  it("warns about the expand-step table as group (a)", async () => {
    const warnings = await assertRowSecurity(postgres.database, {
      ...tenantIsolationOptions(),
      strict: false,
    });
    expect(warnings).toEqual([expect.stringMatching(EXPAND)]);
  });

  it("fails it in strict mode", async () => {
    await expect(
      assertRowSecurity(postgres.database, { ...tenantIsolationOptions(), strict: true }),
    ).rejects.toThrow(/docs\.folders holds a nullable tenant_id with no pol_folders_tenant_id/);
  });

  it("keeps the hard checks for a NOT NULL tenant_id", async () => {
    const em = postgres.database.em();
    await em.execute('alter table "docs"."folders" alter column "tenant_id" set not null');
    try {
      const audit = assertRowSecurity(postgres.database, {
        ...tenantIsolationOptions(),
        strict: false,
      });
      await expect(audit).rejects.toThrow(/docs\.folders has no policy pol_folders_tenant_id/);
      await expect(audit).rejects.toThrow(
        /docs\.folders: pol_folders_scope_path is a second permissive policy/,
      );
    } finally {
      await em.execute('alter table "docs"."folders" alter column "tenant_id" drop not null');
    }
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
