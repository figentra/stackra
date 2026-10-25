/**
 * Stackra file contract:
 * Purpose: unit and type tests of `named` and the `Named` and `NamedToken` types: one frozen token per port and name,
 *          an empty name refused, and `Named<Port, "x">` a port instance that a bare port instance is not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 17).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { named } from "#core/functions/named.function";
import type { Named } from "#core/types/named.type";
import type { NamedToken } from "#core/types/named-token.type";

abstract class Ledger extends Port {
  abstract balance(): number;
}

abstract class Cache extends Port {}

describe("named", () => {
  it("gives one frozen token per port and name", () => {
    const primary = named(Ledger, "primary");
    expect(primary).toEqual({ port: Ledger, name: "primary" });
    expect(named(Ledger, "primary")).toBe(primary);
    expect(named(Ledger, "secondary")).not.toBe(primary);
    expect(named(Cache, "primary")).not.toBe(primary);
    expect(Object.isFrozen(primary)).toBe(true);
  });

  it("refuses an empty name", () => {
    expect(() => named(Ledger, "")).toThrow(TypeError);
  });

  it("types the token and the named instance", () => {
    expectTypeOf(named(Ledger, "primary")).toEqualTypeOf<NamedToken<Ledger, "primary">>();
    const plain = {} as Ledger;
    // @ts-expect-error -- a bare port instance is not the named one
    const wrong: Named<Ledger, "primary"> = plain;
    const right = plain as Named<Ledger, "primary">;
    const asPort: Ledger = right;
    expect([wrong, asPort]).toHaveLength(2);
  });
});
