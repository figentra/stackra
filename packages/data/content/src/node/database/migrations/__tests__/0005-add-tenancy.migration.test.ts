/**
 * Stackra file contract:
 * Purpose: unit tests of `AddTenancyMigration`: `custom_fields`, `custom_field_value_sets` and `revisions` each gain a
 *          nullable `tenant_id` defaulting to `app.tenant_id`, indexed online, and no policy changes.
 * Boundary: test only; pure compilation through @stackra/database with the tenancy macro, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0347 (decision 1); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { AddTenancyMigration } from "#node/database/migrations/0005-add-tenancy.migration";

const TABLES = ["custom_fields", "custom_field_value_sets", "revisions"];

describe("AddTenancyMigration", () => {
  const sql = compileMigration(AddTenancyMigration, {
    schema: "content",
    macros: [BelongsToTenantMacro],
  })
    .steps.flatMap((step) => step.sql)
    .join("\n");

  it("adds a nullable column filled from the call's tenant to each table, indexed online", () => {
    for (const table of TABLES) {
      expect(sql).toContain(
        `alter table "content"."${table}" add column "tenant_id" varchar(33) default nullif(current_setting('app.tenant_id', true), '')::varchar(33) null`,
      );
      expect(sql).toContain(
        `create index concurrently "idx_${table}_tenant_id" on "content"."${table}"`,
      );
    }
  });

  it("leaves each table's scope-path policy as it is", () => {
    expect(sql).not.toContain("policy");
    expect(sql).not.toContain("row level security");
  });
});
