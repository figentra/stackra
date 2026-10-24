/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Service`: a bare kind base registered as `service`, constructor injection through
 *          `super()`, a type-only brand, and no called form.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16,
 *                     17 and 25).
 */
import { describe, expect, it } from "@stackra/testing";

import { Service } from "#core/bases/service.base";
import { kindOf } from "#core/functions/kind-of.function";

class Pricing {
  readonly rate = 2;
}

class QuoteService extends Service {
  private readonly pricing: Pricing;

  constructor(pricing: Pricing) {
    super();
    this.pricing = pricing;
  }

  quote(amount: number): number {
    return amount * this.pricing.rate;
  }
}

describe("Service", () => {
  it("is the registered bare base of a service", () => {
    expect(kindOf(Service)).toEqual({ kind: "service", options: {} });
    expect(kindOf(QuoteService)?.kind).toBe("service");
  });

  it("injects through the constructor and keeps no state of its own", () => {
    const service = new QuoteService(new Pricing());
    expect(service).toBeInstanceOf(Service);
    expect(service.quote(5)).toBe(10);
    expect("~kind" in service).toBe(false);
  });

  it("has no called form", () => {
    // @ts-expect-error -- Service takes no options
    expect(() => Service({})).toThrow(TypeError);
  });
});
