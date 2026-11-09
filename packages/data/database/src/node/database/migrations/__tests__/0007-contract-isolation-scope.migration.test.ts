/**
 * Stackra file contract:
 * Purpose: unit tests of `ContractIsolationScopeMigration`: one transactional step that first refuses while any of
 *          the four tables holds a null `isolation_scope_id`, then per table sets it NOT NULL, swaps the permissive
 *          scope-path policy for `pol_<table>_isolation_scope_id` on `app.tenant_id` and keeps the scope path as a
 *          restrictive policy.
 *          Its squawk ignores leave each step's checksum as it was released (STA-2612).
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0239 (2026-11-07 amendment, item 3); ADR 0347 (decisions 1 to 3).
 */
import { createHash } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { ContractIsolationScopeMigration } from "#node/database/migrations/0007-contract-isolation-scope.migration";

const TABLES = ["sequence_counters", "sequence_blocks", "sequence_voids", "projection_rows"];

/** The reviewed squawk ignore written above each SET NOT NULL (STA-2612). */
const NOT_NULL_LINT =
  "-- lint: contract step after the expand phase; the pre-flight above refused any NULL, the table is pre-production, and the step runs once (ADR 0239).\n" +
  "-- squawk-ignore adding-not-nullable-field\n";

/** A lint comment line, which the runner leaves out of a migration's checksum. */
const LINT_LINE = /^-- (?:squawk-ignore|lint:)[^\n]*\n/gm;

/** Each step's SHA-256 without its lint lines, as the release before the ignores compiled it. */
const RELEASED_CHECKSUMS = ["ba1eb7192a278bf7280c3a5e779a5bb9f849f8b01a2dabf98fbc9cd4acc15fcb"];

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

describe("ContractIsolationScopeMigration", () => {
  const { steps } = compileMigration(ContractIsolationScopeMigration, { schema: "database" });
  const sql = steps.flatMap((step) => step.sql);

  it("is one transactional step whose first statement is the pre-flight over the four tables", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
    expect(sql[0]).toMatch(/^do \$\$/);
    for (const table of TABLES)
      expect(sql[0]).toContain(`from "database"."${table}" where "isolation_scope_id" is null;`);
    expect(sql.slice(1).some((statement) => statement.startsWith("do "))).toBe(false);
  });

  it("makes isolation_scope_id NOT NULL with its one equality, and the scope path restrictive", () => {
    for (const table of TABLES) {
      const qualified = `"database"."${table}"`;
      expect(sql).toContain(
        `${NOT_NULL_LINT}alter table ${qualified} alter column "isolation_scope_id" set not null`,
      );
      expect(sql).toContain(`drop policy "pol_${table}_scope_path" on ${qualified}`);
      expect(sql).toContain(
        `create policy "pol_${table}_isolation_scope_id" on ${qualified} using ("isolation_scope_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33)) with check ("isolation_scope_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33))`,
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

  it("leaves scope_id as it is", () => {
    expect(sql.join("\n")).not.toContain('"scope_id"');
  });

  it("carries its squawk ignores, and hashes as released without the lint lines (STA-2612)", () => {
    expect(sql.filter((statement) => statement.startsWith(NOT_NULL_LINT))).toHaveLength(
      TABLES.length,
    );
    expect(steps.map((step) => checksum(step.sql))).toEqual(RELEASED_CHECKSUMS);
  });
});
