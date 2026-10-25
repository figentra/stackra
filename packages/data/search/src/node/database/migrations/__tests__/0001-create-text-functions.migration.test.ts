/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateTextFunctionsMigration`: one transactional step that creates the `search` schema, the
 *          approved trigram extension and the immutable `search.unaccent_immutable(text)` with the same folding as
 *          `searchWordsOf`, each with its inverse.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0160; ADR 0221 (decision 3).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateTextFunctionsMigration } from "#node/database/migrations/0001-create-text-functions.migration";

describe("CreateTextFunctionsMigration", () => {
  const { after, steps } = compileMigration(CreateTextFunctionsMigration, {
    schema: "search",
    createsSchema: true,
  });
  const [step] = steps;

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the schema, the trigram extension and the immutable folding function", () => {
    expect(step?.sql[0]).toBe('create schema if not exists "search"');
    expect(step?.sql[1]).toBe('create extension if not exists "pg_trgm"');
    expect(step?.sql[2]).toContain("create function search.unaccent_immutable(value text)");
    expect(step?.sql[2]).toContain("immutable strict parallel safe");
    expect(step?.sql[2]).toContain("\\u064b-\\u065f");
    expect(step?.sql[2]).toContain("U&'\\0671\\0649\\0629', U&'\\0627\\064a\\0647'");
  });

  it("undoes the function, the extension and the schema, last first", () => {
    expect(step?.inverse).toEqual([
      "drop function if exists search.unaccent_immutable(text)",
      'drop extension if exists "pg_trgm"',
      'drop schema if exists "search"',
    ]);
  });
});
