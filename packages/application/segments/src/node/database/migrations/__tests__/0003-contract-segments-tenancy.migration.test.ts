/**
 * Stackra file contract:
 * Purpose: tests of `ContractSegmentsTenancyMigration`: one transactional step that first refuses while a row of
 *          `segments` and `segment_memberships` has a null `tenant_id`, then per table sets `tenant_id` NOT NULL, swaps
 *          the permissive scope-path policy for `pol_<table>_tenant_id` on `app.tenant_id` and writes the scope path
 *          again as a restrictive policy.
 * Boundary: test only; pure compilation through @stackra/database with the tenancy macro, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0239 (2026-11-07 amendment, item 1); ADR 0347 (decisions 1 to 3).
 */
import { compileMigration } from "@stackra/database";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { ContractSegmentsTenancyMigration } from "#node/database/migrations/0003-contract-segments-tenancy.migration";

const TABLES = ["segments", "segment_memberships"];

describe("ContractSegmentsTenancyMigration", () => {
  const { steps } = compileMigration(ContractSegmentsTenancyMigration, {
    schema: "segments",
    macros: [BelongsToTenantMacro],
  });
  const sql = steps.flatMap((step) => step.sql);

  it("is one transactional step whose first statement is the pre-flight over every table", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
    expect(sql[0]).toMatch(/^do \$\$/);
    for (const table of TABLES)
      expect(sql[0]).toContain(`from "segments"."${table}" where "tenant_id" is null;`);
  });

  it("makes tenant_id NOT NULL with its one equality, and the scope path restrictive", () => {
    for (const table of TABLES) {
      const qualified = `"segments"."${table}"`;
      expect(sql).toContain(`alter table ${qualified} alter column "tenant_id" set not null`);
      expect(sql).toContain(
        `create policy "pol_${table}_tenant_id" on ${qualified} using ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33)) with check ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33))`,
      );
      expect(
        sql.some((statement) =>
          statement.startsWith(
            `create policy "pol_${table}_scope_path" on ${qualified} as restrictive using (nullif(current_setting('app.scope_paths', true), '') is null or "scope_path" ?`,
          ),
        ),
      ).toBe(true);
    }
  });

  it("drops the permissive scope-path policy each table was created with", () => {
    for (const table of TABLES)
      expect(
        sql.filter(
          (statement) =>
            statement.startsWith("drop policy ") && statement.endsWith(`"segments"."${table}"`),
        ),
      ).toHaveLength(1);
  });
});
