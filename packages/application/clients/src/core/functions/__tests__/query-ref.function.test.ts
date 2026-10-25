/**
 * Stackra file contract:
 * Purpose: unit and type tests of `queryRef`: the statics a generated query class carries, the invalidating events from
 *          the top level and from `cache` together, the cache time, and the fit with `@stackra/query`'s `LiveQueryRef`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decision 3); ADR 0305 (query `cache`); owner decision R-25.
 */
import { HttpMethod } from "@stackra/contracts";
import type { LiveQueryRef } from "@stackra/query";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { CALL_REFS } from "#core/constants/call-refs.constant";
import { eventRef } from "#core/functions/event-ref.function";
import { queryRef } from "#core/functions/query-ref.function";
import type { QueryOutput } from "#core/types/query-output.type";

class OrderPaid extends eventRef("orders.order.paid.v1", {
  payload: z.object({ orderId: z.string() }),
}) {}

class StockLow extends eventRef("inventory.stock.low.v1", {
  payload: z.object({ variantId: z.string() }),
}) {}

class OrderKpisQuery extends queryRef("orders.order.kpis@1", {
  input: z.object({ range: z.enum(["today", "last_7_days"]) }),
  output: z.object({ revenue: z.number().int(), orders: z.number().int() }),
  http: { method: HttpMethod.Get, path: "/orders/kpis" },
  invalidateOn: [StockLow],
  cache: { ttl: "5m", invalidateOn: [OrderPaid] },
}) {}

class PointsIssuedQuery extends queryRef("loyalty_kit.points.stats_today@1", {
  input: z.object({}),
  output: z.object({ earned: z.number().int() }),
}) {}

describe("queryRef", () => {
  it("carries the key, the derived permission and the route as statics", () => {
    expect(OrderKpisQuery.kind).toBe("query");
    expect(OrderKpisQuery.key).toBe("orders.order.kpis@1");
    expect(OrderKpisQuery.permission).toBe("orders.order.kpis");
    expect(OrderKpisQuery.endpoint).toEqual({ method: "GET", path: "/orders/kpis" });
  });

  it("keeps every invalidating event and the cache time", () => {
    expect(OrderKpisQuery.invalidateOn).toEqual([StockLow, OrderPaid]);
    expect(OrderKpisQuery.ttl).toBe("5m");
  });

  it("has no invalidating events, route or cache time when none is declared", () => {
    expect(PointsIssuedQuery.invalidateOn).toEqual([]);
    expect("endpoint" in PointsIssuedQuery).toBe(false);
    expect("ttl" in PointsIssuedQuery).toBe(false);
  });

  it("records each ref by key", () => {
    expect(CALL_REFS.get("orders.order.kpis@1")).toBe(Object.getPrototypeOf(OrderKpisQuery));
  });

  it("is a live query ref and types its answer", () => {
    expectTypeOf(OrderKpisQuery).toExtend<LiveQueryRef>();
    expectTypeOf<QueryOutput<typeof OrderKpisQuery>>().toEqualTypeOf<{
      revenue: number;
      orders: number;
    }>();
  });
});
