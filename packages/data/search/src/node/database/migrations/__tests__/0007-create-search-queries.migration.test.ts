/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateSearchQueriesMigration`: it creates `search.queries` under the scope policy with
 *          every column commented.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); stackra-326.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateSearchQueriesMigration } from "#node/database/migrations/0007-create-search-queries.migration";

describe("CreateSearchQueriesMigration", () => {
  const { steps } = compileMigration(CreateSearchQueriesMigration, { schema: "search" });
  const sql = steps.flatMap((step) => step.sql);

  it("creates the query log keyed by id under row-level security", () => {
    const create = sql.find((statement) => statement.startsWith('create table "search"."queries"'));
    expect(create).toContain('primary key ("id")');
    expect(sql.some((statement) => /row level security/i.test(statement))).toBe(true);
  });

  it("comments every column", () => {
    for (const column of [
      "id",
      "model",
      "phrase",
      "hits",
      "latency_ms",
      "clicked_id",
      "searched_at",
    ])
      expect(
        sql.some((statement) =>
          statement.startsWith(`comment on column "search"."queries"."${column}"`),
        ),
      ).toBe(true);
  });
});
