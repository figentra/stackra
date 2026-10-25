/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: `PostgresSearchDriver` (the template wiring's `postgres`
 *          candidate), `SearchableMacro` (the template migrations' `t.searchable(...)`), and gen's
 *          `registerSearchableModels` with its `SearchableChangeService` are its only values, and the macro's argument
 *          type resolves.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as node from "#node/index";
import type { SearchableColumns } from "#node/index";

describe("@stackra/search/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "PostgresSearchDriver",
      "SearchableChangeService",
      "SearchableMacro",
      "registerSearchableModels",
    ]);
  });

  it("resolves the macro's argument type", () => {
    expectTypeOf<SearchableColumns["text"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<SearchableColumns["locales"]>().toEqualTypeOf<readonly string[] | undefined>();
  });
});
