/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Promotable` port: an abstract class extending `Port`, and a driver of it is an
 *          instance of it with its kind and four methods typed as the port declares.
 * Boundary: test only; the driver is a minimal stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decisions 6 and 8); ADR 0395; ADR 0263.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Promotable } from "#contracts/ports/promotable.port";
import type { PromotionDiff } from "#contracts/index";

/** A kind with nothing in it. */
class EmptyPromotableDriver extends Driver(Promotable) {
  readonly kind = "empty";

  async export(): Promise<unknown> {
    return {};
  }

  async diff(): Promise<PromotionDiff> {
    return { kind: this.kind, base: "0", changes: [], previous: {} };
  }

  async apply(): Promise<void> {}

  async rollbackOf(): Promise<PromotionDiff> {
    return this.diff();
  }
}

describe("Promotable", () => {
  it("is a port that a driver extends", () => {
    const kind = new EmptyPromotableDriver();
    expect(kind).toBeInstanceOf(Promotable);
    expect(kind).toBeInstanceOf(Port);
    expect(kind.kind).toBe("empty");
  });

  it("types its methods", () => {
    expectTypeOf<Promotable["export"]>().parameters.toEqualTypeOf<[ScopeRef]>();
    expectTypeOf<Promotable["diff"]>().parameters.toEqualTypeOf<
      [ScopeRef, unknown, ({ readonly release?: string } | undefined)?]
    >();
    expectTypeOf<Promotable["apply"]>().parameters.toEqualTypeOf<
      [ScopeRef, PromotionDiff, string, ({ readonly release?: string } | undefined)?]
    >();
    expectTypeOf<Promotable["rollbackOf"]>().parameters.toEqualTypeOf<
      [ScopeRef, PromotionDiff, ({ readonly release?: string } | undefined)?]
    >();
    expectTypeOf<Promotable["~key"]>().toEqualTypeOf<"settings.Promotable">();
  });
});
