/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateSynonymsMigration`: it creates `data_maintenance.synonyms` keyed by its public id under the forced
 *          tenant policy, with a tenant-leading lookup index and every column commented.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0492 (decision 5).
 */
import { compileMigration } from "@stackra/database";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { CreateSynonymsMigration } from "#node/database/migrations/0001-create-synonyms.migration";

describe("CreateSynonymsMigration", () => {
  const { steps } = compileMigration(CreateSynonymsMigration, {
    schema: "data_maintenance",
    createsSchema: true,
    macros: [BelongsToTenantMacro],
  });
  const sql = steps.flatMap((step) => step.sql);

  it("creates the synonym table keyed by id under a forced tenant policy", () => {
    const create = sql.find((statement) =>
      statement.startsWith('create table "data_maintenance"."synonyms"'),
    );
    expect(create).toContain('primary key ("id")');
    expect(sql.some((statement) => /force row level security/i.test(statement))).toBe(true);
    expect(sql.some((statement) => statement.includes("tenant_id"))).toBe(true);
  });

  it("indexes the tenant's lookup and comments every column", () => {
    expect(
      sql.some((statement) =>
        /create index .*"tenant_id", "index_name", "language"/.test(statement),
      ),
    ).toBe(true);
    for (const column of ["index_name", "language", "terms"])
      expect(
        sql.some((statement) =>
          statement.startsWith(`comment on column "data_maintenance"."synonyms"."${column}"`),
        ),
      ).toBe(true);
  });
});
