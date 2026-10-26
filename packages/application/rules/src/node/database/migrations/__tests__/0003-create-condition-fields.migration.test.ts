/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateConditionFieldsMigration`: the `condition_fields` table with its columns, one field per
 *          model and source, and no row-level security (a platform table).
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); STA-1250.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateConditionFieldsMigration } from "#node/database/migrations/0003-create-condition-fields.migration";

describe("CreateConditionFieldsMigration", () => {
  const sql = compileMigration(CreateConditionFieldsMigration, { schema: "rules" })
    .steps.flatMap((step) => step.sql)
    .join("\n");

  it("creates the registry table with its columns", () => {
    expect(sql).toContain('"condition_fields"');
    for (const column of [
      '"model" varchar(127)',
      '"source" varchar(63)',
      '"field" varchar(63)',
      '"type" varchar(31)',
    ])
      expect(sql).toContain(column);
    expect(sql).toMatch(/"values" jsonb/);
  });

  it("keeps one field per model and source, without row-level security", () => {
    expect(sql).toMatch(/create unique index .*"model", "source", "field"/);
    expect(sql).not.toMatch(/row level security/i);
  });
});
