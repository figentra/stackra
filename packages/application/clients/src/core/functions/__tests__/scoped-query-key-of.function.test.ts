/**
 * Stackra file contract:
 * Purpose: unit tests of `scopedQueryKeyOf`: no scope keeps the query's own key, a scope adds `{ scope }` after it, two
 *          scopes give two keys, and the query key stays first so invalidating the query reaches every scope.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0260 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { queryKeyOf } from "#core/functions/query-key-of.function";
import { queryRef } from "#core/functions/query-ref.function";
import { scopedQueryKeyOf } from "#core/functions/scoped-query-key-of.function";

class ListUnitsQuery extends queryRef("units.unit.list@1", {
  input: z.object({}),
  output: z.object({ items: z.array(z.string()) }),
}) {}

describe("scopedQueryKeyOf", () => {
  it("keeps the query's own key without a scope", () => {
    expect(scopedQueryKeyOf(ListUnitsQuery, {}, undefined)).toEqual(queryKeyOf(ListUnitsQuery, {}));
  });

  it("caches each scope apart, with the query key first", () => {
    const parent = scopedQueryKeyOf(ListUnitsQuery, {}, "platform.acme");
    const branch = scopedQueryKeyOf(ListUnitsQuery, {}, "platform.acme.branch-2");
    expect(parent).toEqual(["units.unit.list@1", {}, { scope: "platform.acme" }]);
    expect(branch).not.toEqual(parent);
    expect(branch[0]).toBe("units.unit.list@1");
  });
});
