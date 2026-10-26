/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateFoldFunctionMigration`: one transactional step that creates the immutable
 *          `search.fold(text)` with the marks, letter variants and article folding of `normalizeArabic`, and drops it
 *          on the way down.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0404.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateFoldFunctionMigration } from "#node/database/migrations/0003-create-fold-function.migration";

describe("CreateFoldFunctionMigration", () => {
  const { after, steps } = compileMigration(CreateFoldFunctionMigration, { schema: "search" });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the immutable folding function with the article and the Quranic marks", () => {
    expect(sql).toContain("create function search.fold(value text) returns text");
    expect(sql).toContain("immutable strict parallel safe");
    expect(sql).toContain("\\u0610-\\u061a");
    expect(sql).toContain("\\u06d6-\\u06ed");
    expect(sql).toContain("U&'\\0671\\0649\\0629', U&'\\0627\\064a\\0647'");
    expect(sql).toContain("'(^|\\s)\\u0627\\u0644(?=\\S{2,})', '\\1', 'g'");
  });

  it("drops the function on the way down", () => {
    expect(step?.inverse).toEqual(["drop function if exists search.fold(text)"]);
  });
});
