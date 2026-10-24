/**
 * Stackra file contract:
 * Purpose: unit and type tests of `remoteQuery`: a service's query descriptor is a query ref whose `endpoint` is the
 *          route.
 * Boundary: test only; the descriptor restates the template's generated `services/commerce` pricing client.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decisions 3 and 6).
 */
import { HttpMethod } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { remoteQuery } from "#core/functions/remote-query.function";
import type { QueryOutput } from "#core/types/query-output.type";

const QuotePriceQuery = remoteQuery("pricing.price.quote@1", {
  input: z.object({ market: z.string() }),
  output: z.object({
    currency: z.string(),
    lines: z.array(z.object({ unitPriceMinor: z.number() })),
  }),
  endpoint: { method: HttpMethod.Post, path: "/prices/quote" },
});

describe("remoteQuery", () => {
  it("is a query ref whose route is the endpoint", () => {
    expect(QuotePriceQuery.kind).toBe("query");
    expect(QuotePriceQuery.permission).toBe("pricing.price.quote");
    expect(QuotePriceQuery.endpoint).toEqual({ method: "POST", path: "/prices/quote" });
    expect(QuotePriceQuery.invalidateOn).toEqual([]);
  });

  it("types its answer", () => {
    expectTypeOf<QueryOutput<typeof QuotePriceQuery>["currency"]>().toEqualTypeOf<string>();
  });
});
