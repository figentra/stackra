/**
 * Stackra file contract:
 * Purpose: tests of `ContractAchievementsTenancyMigration`: one transactional step that first refuses while a row of
 *          `award_kinds` and `awards` has a null `tenant_id`, then per table sets `tenant_id` NOT NULL, swaps the
 *          permissive scope-path policy for `pol_<table>_tenant_id` on `app.tenant_id` and writes the scope path again
 *          as a restrictive policy.
 *          Its squawk ignores leave each step's checksum as it was released (STA-2612).
 * Boundary: test only; pure compilation through @stackra/database with the tenancy macro, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0239 (2026-11-07 amendment, item 1); ADR 0347 (decisions 1 to 3).
 */
import { createHash } from "node:crypto";

import { compileMigration } from "@stackra/database";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { ContractAchievementsTenancyMigration } from "#node/database/migrations/0004-contract-achievements-tenancy.migration";

const TABLES = ["award_kinds", "awards"];

/** The reviewed squawk ignore written above each SET NOT NULL (STA-2612). */
const NOT_NULL_LINT =
  "-- lint: contract step after the expand phase; the pre-flight above refused any NULL, the table is pre-production, and the step runs once (ADR 0239).\n" +
  "-- squawk-ignore adding-not-nullable-field\n";

/** A lint comment line, which the runner leaves out of a migration's checksum. */
const LINT_LINE = /^-- (?:squawk-ignore|lint:)[^\n]*\n/gm;

/** Each step's SHA-256 without its lint lines, as the release before the ignores compiled it. */
const RELEASED_CHECKSUMS = ["5d4bfc78e00f3b57fc22bdffd24332b86e2d40c9f7bf23c289d5f737ed16e910"];

/** The runner's checksum of a step as gen writes its statements, without the lint lines. */
const checksum = (statements: readonly string[]): string =>
  createHash("sha256")
    .update(
      statements
        .map((statement) => `${statement};\n`)
        .join("")
        .replaceAll(LINT_LINE, ""),
    )
    .digest("hex");

describe("ContractAchievementsTenancyMigration", () => {
  const { steps } = compileMigration(ContractAchievementsTenancyMigration, {
    schema: "achievements",
    macros: [BelongsToTenantMacro],
  });
  const sql = steps.flatMap((step) => step.sql);

  it("is one transactional step whose first statement is the pre-flight over every table", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
    expect(sql[0]).toMatch(/^do \$\$/);
    for (const table of TABLES)
      expect(sql[0]).toContain(`from "achievements"."${table}" where "tenant_id" is null;`);
  });

  it("makes tenant_id NOT NULL with its one equality, and the scope path restrictive", () => {
    for (const table of TABLES) {
      const qualified = `"achievements"."${table}"`;
      expect(sql).toContain(
        `${NOT_NULL_LINT}alter table ${qualified} alter column "tenant_id" set not null`,
      );
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
            statement.startsWith("drop policy ") && statement.endsWith(`"achievements"."${table}"`),
        ),
      ).toHaveLength(1);
  });

  it("carries its squawk ignores, and hashes as released without the lint lines (STA-2612)", () => {
    expect(sql.filter((statement) => statement.startsWith(NOT_NULL_LINT))).toHaveLength(
      TABLES.length,
    );
    expect(steps.map((step) => checksum(step.sql))).toEqual(RELEASED_CHECKSUMS);
  });
});
