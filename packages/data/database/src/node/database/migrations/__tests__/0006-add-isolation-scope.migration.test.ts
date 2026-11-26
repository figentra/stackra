/**
 * Stackra file contract:
 * Purpose: unit tests of `AddIsolationScopeMigration`: the sequence and projection tables each gain a nullable
 *          `isolation_scope_id` defaulting to `app.tenant_id`, indexed online, beside an unchanged `scope_id`, and no
 *          policy changes.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0347 (decision 1); ADR 0323 (decision 1); ADR 0159 (as amended).
 */
import { describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { AddIsolationScopeMigration } from "#node/database/migrations/0006-add-isolation-scope.migration";

const TABLES = ["sequence_counters", "sequence_blocks", "sequence_voids", "projection_rows"];

describe("AddIsolationScopeMigration", () => {
  const sql = compileMigration(AddIsolationScopeMigration, { schema: "database" })
    .steps.flatMap((step) => step.sql)
    .join("\n");

  it("adds a nullable column filled from the call's setting to each table, indexed online", () => {
    for (const table of TABLES) {
      expect(sql).toContain(
        `alter table "database"."${table}" add column "isolation_scope_id" varchar(33) default nullif(current_setting('app.tenant_id', true), '')::varchar(33) null`,
      );
      expect(sql).toContain(
        `create index concurrently "idx_${table}_isolation_scope_id" on "database"."${table}"`,
      );
    }
  });

  it("tells squawk, statement by statement, that a setting default rewrites no table", () => {
    const ignores = sql.match(
      /-- squawk-ignore adding-field-with-default\nalter table "database"\."\w+" add column "isolation_scope_id"/g,
    );
    expect(ignores).toHaveLength(TABLES.length);
  });

  it("leaves each table's scope column and scope-path policy as they are", () => {
    expect(sql).not.toContain('"scope_id"');
    expect(sql).not.toContain("policy");
    expect(sql).not.toContain("row level security");
  });
});
