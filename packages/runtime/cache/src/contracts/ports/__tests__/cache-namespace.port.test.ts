/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `CacheNamespace` port: an abstract class that extends `Port`, carries the port
 *          brand, is implemented by `Driver(CacheNamespace)`, and is a container token a test can override.
 * Boundary: test only; the driver here is a test-local fixed namespace.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decision 2); ADR
 *                     0294 (decisions 16 and 17).
 */
import { Container, Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CacheNamespace } from "#contracts/ports/cache-namespace.port";

class FixedCacheNamespaceDriver extends Driver(CacheNamespace) {
  current(): string {
    return "scope_a";
  }
}

describe("CacheNamespace", () => {
  it("is an abstract port", () => {
    expect(new FixedCacheNamespaceDriver()).toBeInstanceOf(Port);
    expect(new FixedCacheNamespaceDriver()).toBeInstanceOf(CacheNamespace);
    expectTypeOf<CacheNamespace["~kind"]>().toEqualTypeOf<"port">();
    // @ts-expect-error -- a port is abstract
    const direct = new CacheNamespace();
    expect(direct).toBeInstanceOf(Port);
  });

  it("makes a driver implement current", () => {
    // @ts-expect-error -- current is abstract and not implemented
    class EmptyDriver extends Driver(CacheNamespace) {}
    expect(EmptyDriver).toBeTypeOf("function");
  });

  it("is a container token", async () => {
    const container = await Container.create([], {
      overrides: new Map([[CacheNamespace, new FixedCacheNamespaceDriver()]]),
    });
    expect(container.get(CacheNamespace).current()).toBe("scope_a");
  });
});
