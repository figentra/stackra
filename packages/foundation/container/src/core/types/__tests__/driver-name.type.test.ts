/**
 * Stackra file contract:
 * Purpose: type tests of `DriverName<Port>`, `DriverRegistry` and `PortRegistry`: the names gen registers per port key type a config
 *          field, a port with a `~key` brand or a `PortRegistry` class takes its own names only, and a misspelt name is refused.
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
    "demo.Store": "s3" | "disk";
    "demo.TwinA": "a";
    "demo.TwinB": "b";
  }
}

declare module "#core/types/port-registry.type" {
  interface PortRegistry {
    "demo.Store": typeof Store;
    "demo.TwinA": typeof TwinA;
    "demo.TwinB": typeof TwinB;
  }
}

abstract class Ledger extends Port {
  declare readonly "~key": "demo.Ledger";

  abstract balance(): number;
}

abstract class Cache extends Port {}

abstract class Store extends Port {
  abstract put(key: string): void;
}

abstract class TwinA extends Port {
  abstract twin(): void;
}

abstract class TwinB extends Port {
  abstract twin(): void;
}

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

  it("narrows an unbranded port registered in PortRegistry to its own names, by its class", () => {
    expectTypeOf<DriverName<Store>>().toEqualTypeOf<"s3" | "disk">();
    const store: DriverName<Store> = "s3";
    // @ts-expect-error -- redis is another port's driver
    const other: DriverName<Store> = "redis";
    // @ts-expect-error -- a misspelling
    const misspelt: DriverName<Store> = "dsik";
    expect([store, other, misspelt]).toEqual(["s3", "redis", "dsik"]);
  });

  it("widens to every registered name for a port nobody registered", () => {
    expectTypeOf<DriverName<Cache>>().toEqualTypeOf<
      "postgres" | "memory" | "redis" | "s3" | "disk" | "a" | "b"
    >();
  });

  it("takes the union of two structurally identical unbranded ports, never a wrong one", () => {
    expectTypeOf<DriverName<TwinA>>().toEqualTypeOf<"a" | "b">();
    expectTypeOf<DriverName<TwinB>>().toEqualTypeOf<"a" | "b">();
  });
});
