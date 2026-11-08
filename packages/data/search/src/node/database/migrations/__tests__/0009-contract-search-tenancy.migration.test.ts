/**
 * Stackra file contract:
 * Purpose: tests of `ContractSearchTenancyMigration`: one transactional step whose pre-flight counts only the null
 *          `tenant_id` rows below the platform root, then per table the platform policy (its own rows and the NULL
 *          rows to read, its own to write), the two restrictive write policies and the scope path restrictive with the
 *          NULL rows exempt; `tenant_id` stays nullable.
 * Boundary: test only; pure compilation through @stackra/database with the tenancy macro, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0239 (2026-11-07 amendment, item 6, gap C); ADR 0347 (decisions 1 to 3).
 */
import { compileMigration } from "@stackra/database";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { ContractSearchTenancyMigration } from "#node/database/migrations/0009-contract-search-tenancy.migration";

const TABLES = ["vector_items", "queries"];

/** The session's owner setting, as the policies compare it. */
const OWNER_SETTING = "nullif(current_setting('app.tenant_id', true), '')::varchar(33)";

describe("ContractSearchTenancyMigration", () => {
  const { steps } = compileMigration(ContractSearchTenancyMigration, {
    schema: "search",
    macros: [BelongsToTenantMacro],
  });
  const sql = steps.flatMap((step) => step.sql);

  it("is one transactional step whose pre-flight counts only null tenants below the platform root", () => {
    expect(steps).toHaveLength(1);
    expect(sql[0]).toMatch(/^do \$\$/);
    for (const table of TABLES)
      expect(sql[0]).toContain(
        `from "search"."${table}" where "tenant_id" is null and (nlevel("scope_path") > 1);`,
      );
  });

  it("keeps tenant_id nullable under the platform policy and its two write policies", () => {
    expect(sql.join("\n")).not.toContain("set not null");
    for (const table of TABLES) {
      const qualified = `"search"."${table}"`;
      const own = `"tenant_id" is not distinct from ${OWNER_SETTING}`;
      expect(sql).toContain(
        `create policy "pol_${table}_tenant_id" on ${qualified} using ("tenant_id" = ${OWNER_SETTING} or "tenant_id" is null) with check (${own})`,
      );
      expect(sql).toContain(
        `create policy "pol_${table}_tenant_id_write_update" on ${qualified} as restrictive for update using (${own})`,
      );
      expect(sql).toContain(
        `create policy "pol_${table}_tenant_id_write_delete" on ${qualified} as restrictive for delete using (${own})`,
      );
    }
  });

  it("writes the scope path again as restrictive, leaving the platform's NULL rows to every tenant", () => {
    for (const table of TABLES) {
      expect(sql).toContain(`drop policy "pol_${table}_scope_path" on "search"."${table}"`);
      expect(
        sql.some((statement) =>
          statement.startsWith(
            `create policy "pol_${table}_scope_path" on "search"."${table}" as restrictive using (nullif(current_setting('app.scope_paths', true), '') is null or "tenant_id" is null or "scope_path" ?`,
          ),
        ),
      ).toBe(true);
    }
  });
});
