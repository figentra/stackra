/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Lifetime`: the three codes, the frozen facet that records a binding's lifetime and
 *          reads it back through the ancestry, and its refusal of a class that is not a binding.
 * Boundary: test only; how the container honours each lifetime is proven in the container's tests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 6
 *                     and 17).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Service } from "#core/bases/service.base";
import { Lifetime } from "#core/decorators/lifetime.decorator";

@Lifetime(Lifetime.Request)
class CartService extends Service {}

class VipCartService extends CartService {}

describe("Lifetime", () => {
  it("holds the three lifetime codes", () => {
    expect([Lifetime.Singleton, Lifetime.Request, Lifetime.Transient]).toEqual([
      "singleton",
      "request",
      "transient",
    ]);
    expectTypeOf<Lifetime>().toEqualTypeOf<"singleton" | "request" | "transient">();
    expect(Object.isFrozen(Lifetime)).toBe(true);
  });

  it("records a binding's lifetime, inherited by a subclass", () => {
    expect(Lifetime.on(CartService)).toBe("request");
    expect(Lifetime.on(VipCartService)).toBe("request");
    expect(Lifetime.on(Service)).toBeUndefined();
    expect([Lifetime.kind, Lifetime.target]).toEqual(["lifetime", "class"]);
  });

  it("refuses a class that is not a binding", () => {
    expect(() => {
      @Lifetime(Lifetime.Transient)
      class Plain {}
      return Plain;
    }).toThrow(TypeError);
  });

  it("takes lifetime codes only", () => {
    // @ts-expect-error -- "forever" is not a lifetime
    expect(() => Lifetime("forever")).not.toThrow();
  });
});
