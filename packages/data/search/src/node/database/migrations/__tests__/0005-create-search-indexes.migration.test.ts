/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateSearchIndexesMigration`: one step that creates `search.indexes` keyed by model and
 *          scope, with its state check and every column commented.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0404 (decision 3).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateSearchIndexesMigration } from "#node/database/migrations/0005-create-search-indexes.migration";

describe("CreateSearchIndexesMigration", () => {
  const { steps } = compileMigration(CreateSearchIndexesMigration, { schema: "search" });
  const sql = steps.flatMap((step) => step.sql);

  it("creates the registry keyed by model and scope, with its state check", () => {
    const create = sql.find((statement) => statement.startsWith('create table "search"."indexes"'));
    expect(create).toContain('primary key ("model", "scope_key")');
    expect(create).toContain(`check ("state" in ('valid', 'invalid', 'rebuilding'))`);
  });

  it("comments every column", () => {
    for (const column of ["model", "scope_key", "state", "facet_hash", "doc_count", "cursor"])
      expect(
        sql.some((statement) =>
          statement.startsWith(`comment on column "search"."indexes"."${column}"`),
        ),
      ).toBe(true);
  });
});
