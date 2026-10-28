/**
 * Stackra file contract:
 * Purpose: unit tests of `registerCachedQueries`: each invalidating event of a cached query is recorded once with the
 *          query and subscribes `QueryCacheEvictorListener`; a query without `invalidateOn` registers nothing; a class
 *          that is not a query is refused.
 * Boundary: test only; `registerListeners` is mocked, so the events registry stays untouched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 31); ADR 0150 (decision 3).
 */
import { ActorKind } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

const { registerListeners } = vi.hoisted(() => ({ registerListeners: vi.fn() }));

vi.mock("@stackra/events", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  registerListeners,
}));

import { Action } from "#core/bases/action.base";
import { Query } from "#core/bases/query.base";
import { QUERY_CACHE_EVICTIONS } from "#core/constants/query-cache-evictions.constant";
import { registerCachedQueries } from "#core/functions/register-cached-queries.function";
import { QueryCacheEvictorListener } from "#core/listeners/query-cache-evictor.listener";

class PointsEarned extends IntegrationEvent({ name: "points.earned" }) {}

class PointsRedeemed extends IntegrationEvent({ name: "points.redeemed" }) {}

class GetBalanceQuery extends Query({
  key: "points.balance",
  actors: [ActorKind.User],
  cache: { ttl: "1m", invalidateOn: [PointsEarned, PointsRedeemed] },
}) {
  async handle(): Promise<number> {
    return 0;
  }
}

class TtlOnlyQuery extends Query({
  key: "points.rules",
  actors: [ActorKind.User],
  cache: { ttl: "1h" },
}) {
  async handle(): Promise<number> {
    return 0;
  }
}

class EarnAction extends Action({
  key: "points.earn",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<void> {}
}

describe(registerCachedQueries, () => {
  it("records each invalidating event once and subscribes the evictor to it", () => {
    registerCachedQueries([GetBalanceQuery, GetBalanceQuery, TtlOnlyQuery]);
    expect(QUERY_CACHE_EVICTIONS.get(PointsEarned)).toEqual([GetBalanceQuery]);
    expect(QUERY_CACHE_EVICTIONS.get(PointsRedeemed)).toEqual([GetBalanceQuery]);
    expect(registerListeners).toHaveBeenCalledWith([[PointsEarned, QueryCacheEvictorListener]]);
    expect(registerListeners).toHaveBeenCalledWith([[PointsRedeemed, QueryCacheEvictorListener]]);
    expect([...QUERY_CACHE_EVICTIONS.values()].flat()).not.toContain(TtlOnlyQuery);
  });

  it("refuses a class that is not a query", () => {
    expect(() => registerCachedQueries([EarnAction as never])).toThrow(/is not a query/);
  });
});
