/**
 * Stackra file contract:
 * Purpose: unit tests of `AddSearchIndexVersionMigration`: one expand step that adds the nullable, commented
 *          `version` column to `search.indexes`.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0221 (decision 7); stackra-303.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AddSearchIndexVersionMigration } from "#node/database/migrations/0006-add-search-index-version.migration";

describe("AddSearchIndexVersionMigration", () => {
  const sql = compileMigration(AddSearchIndexVersionMigration, { schema: "search" }).steps.flatMap(
    (step) => step.sql,
  );

  it("adds the nullable version column with its comment", () => {
    expect(sql).toContain('alter table "search"."indexes" add column "version" integer null');
    expect(
      sql.some((statement) =>
        statement.startsWith(`comment on column "search"."indexes"."version"`),
      ),
    ).toBe(true);
  });
});
