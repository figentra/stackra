/**
 * Stackra file contract:
 * Purpose: unit tests of `registerReplicas`: it records each ref by its key (a later ref of the same key replaces the
 *          earlier one) and refuses a replica without a readable window or a positive integer limit, recording none of
 *          the refs then.
 * Boundary: test only; the queries are classes with the statics `@stackra/clients`' `queryRef` writes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { REPLICAS } from "#core/constants/replicas.constant";
import { registerReplicas } from "#core/functions/register-replicas.function";

class RecentSalesQuery {
  static readonly key = "sales.sale.recent@1";

  static readonly replica = { of: "sales.sale", window: "30d", limit: 5000 };
}

class RecentSalesAgainQuery {
  static readonly key = "sales.sale.recent@1";

  static readonly replica = { of: "sales.sale", window: "7d", limit: 100 };
}

/** A replica ref of `key` with the bounds given. */
const bounded = (key: string, window: string, limit: number) => ({
  key,
  replica: { of: "crm.customer", window, limit },
});

describe("registerReplicas", () => {
  it("records each ref by its key, a later one replacing the earlier", () => {
    registerReplicas([RecentSalesQuery]);
    expect(REPLICAS.get(RecentSalesQuery.key)).toBe(RecentSalesQuery);
    registerReplicas([RecentSalesAgainQuery]);
    expect(REPLICAS.get(RecentSalesQuery.key)).toBe(RecentSalesAgainQuery);
  });

  it("refuses an unreadable window or a limit that is not a positive integer, recording nothing", () => {
    expect(() =>
      registerReplicas([
        bounded("crm.customer.list@1", "30d", 10),
        bounded("crm.a@1", "a month", 10),
      ]),
    ).toThrow(RangeError);
    expect(REPLICAS.has("crm.customer.list@1")).toBe(false);
    for (const limit of [0, 1.5, -1])
      expect(() => registerReplicas([bounded("crm.b@1", "30d", limit)])).toThrow(RangeError);
    expect(REPLICAS.has("crm.b@1")).toBe(false);
  });
});
