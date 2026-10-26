/**
 * Stackra file contract:
 * Purpose: unit tests of `parseSearch`: raw entries for a route with no shape (first value of a repeated name), the
 *          shape's parse when valid, an invalid entry dropped with the rest kept.
 * Boundary: test only; the shape's schema is registered by hand, as gen will.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16).
 */
import { describe, expect, it } from "vitest";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { Route } from "#core/bases/route.base";
import { parseSearch } from "#core/functions/parse-search.function";

class StoreSearch extends Schema {
  q?: string;

  cursor?: string;
}

registerSchemas([
  [StoreSearch, z.object({ q: z.string().min(2).optional(), cursor: z.string().optional() })],
]);

class StoreRoute extends Route({
  path: "/store",
  search: StoreSearch,
}) {}
class ShareRoute extends Route({ path: "/share" }) {}

describe("parseSearch", () => {
  it("keeps the raw entries of a route with no shape", () => {
    expect(parseSearch(new URLSearchParams("shared=abc&shared=def"), ShareRoute)).toEqual({
      shared: "abc",
    });
  });

  it("parses with the route's shape", () => {
    expect(parseSearch(new URLSearchParams("q=tee&cursor=c1"), StoreRoute)).toMatchObject({
      q: "tee",
      cursor: "c1",
    });
  });

  it("drops an invalid entry and keeps the rest", () => {
    const search = parseSearch(new URLSearchParams("q=t&cursor=c1"), StoreRoute);
    expect(search).toMatchObject({ cursor: "c1" });
    expect(search).not.toHaveProperty("q", "t");
  });
});
