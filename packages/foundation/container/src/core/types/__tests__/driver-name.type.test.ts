/**
 * Stackra file contract:
 * Purpose: type tests of `DriverName<Port>` and `DriverRegistry`: the names gen registers per port key type a config
 *          field, a port with a `~key` brand takes its own names only, and a misspelt name is refused either way.
 * Boundary: test only; the registry augmentation below stands in for the one gen writes into `#stackra/wiring`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 4
 *                     and 19).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { DriverName } from "#core/types/driver-name.type";

declare module "#core/types/driver-registry.type" {
  interface DriverRegistry {
    "demo.Ledger": "postgres" | "memory";
    "demo.Cache": "redis";
  }
}

abstract class Ledger extends Port {
  declare readonly "~key": "demo.Ledger";

  abstract balance(): number;
}

abstract class Cache extends Port {}

describe("DriverName", () => {
  it("takes the names registered under a keyed port's key", () => {
    expectTypeOf<DriverName<Ledger>>().toEqualTypeOf<"postgres" | "memory">();
    const ledger: DriverName<Ledger> = "memory";
    // @ts-expect-error -- redis is another port's driver
    const other: DriverName<Ledger> = "redis";
    expect([ledger, other]).toEqual(["memory", "redis"]);
  });

  it("takes every registered name for a port without a key, and still refuses a misspelling", () => {
    const cache: DriverName<Cache> = "redis";
    // @ts-expect-error -- not a registered driver name
    const misspelt: DriverName<Cache> = "memroy";
    expect([cache, misspelt]).toEqual(["redis", "memroy"]);
  });
});
