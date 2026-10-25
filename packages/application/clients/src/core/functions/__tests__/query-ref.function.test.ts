/**
 * Stackra file contract:
 * Purpose: unit and type tests of `queryRef`: the statics a generated query class carries, the invalidating events from
 *          the top level and from `cache` together, the cache time, the replica declaration (typed as `@stackra/query`'s
 *          `ReplicaRef`, a malformed one refused before the ref is recorded), and the fit with `LiveQueryRef`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decision 3); ADR 0305 (query `cache`); owner decision R-25; ADR 0338
 *                     (decision 3).
 */
import { HttpMethod } from "@stackra/contracts";
import type { LiveQueryRef, ReplicaRef } from "@stackra/query";
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

const SALES_REPLICA = { of: "sales.sale", window: "30d", limit: 50, scope: "legalEntityId" };

class RecentSalesQuery extends queryRef("sales.sale.recent@1", {
  input: z.object({ legalEntityId: z.string(), cursor: z.string().optional() }),
  output: z.object({ cursor: z.string() }),
  http: { method: HttpMethod.Get, path: "/sales/recent" },
  replica: SALES_REPLICA,
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

  it("carries a replica declaration and types the ref as a replica", () => {
    expect(RecentSalesQuery.replica).toBe(SALES_REPLICA);
    expect("replica" in PointsIssuedQuery).toBe(false);
    expectTypeOf(RecentSalesQuery).toExtend<ReplicaRef>();
    expectTypeOf(PointsIssuedQuery).not.toExtend<ReplicaRef>();
  });

  it("records a replica with @stackra/query and refuses a malformed one before recording the ref", () => {
    expect(() =>
      queryRef("sales.sale.broken@1", {
        input: z.object({}),
        output: z.object({}),
        replica: { ...SALES_REPLICA, limit: 0 },
      }),
    ).toThrow(RangeError);
    expect(CALL_REFS.has("sales.sale.broken@1")).toBe(false);
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
