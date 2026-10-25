/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ClientQuery`: the key inside the options gives the same query ref as `queryRef`.
 * Boundary: test only; the query restates the template's generated `apps/web` experience client.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decision 3).
 */
import { HttpMethod } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { ClientQuery } from "#core/bases/client-query.base";
import type { QueryOutput } from "#core/types/query-output.type";

class ResolveSiteQuery extends ClientQuery({
  key: "sites.site.resolve",
  input: z.object({ host: z.string() }),
  output: z.object({ id: z.string(), name: z.string() }).nullable(),
  http: { method: HttpMethod.Get, path: "/public/sites/resolve" },
}) {}

describe("ClientQuery", () => {
  it("is a query ref keyed by its option", () => {
    expect(ResolveSiteQuery.kind).toBe("query");
    expect(ResolveSiteQuery.key).toBe("sites.site.resolve");
    expect(ResolveSiteQuery.endpoint).toEqual({ method: "GET", path: "/public/sites/resolve" });
    expect(ResolveSiteQuery.invalidateOn).toEqual([]);
  });

  it("types its answer, null included", () => {
    expectTypeOf<QueryOutput<typeof ResolveSiteQuery>>().toEqualTypeOf<{
      id: string;
      name: string;
    } | null>();
  });
});
