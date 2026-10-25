/**
 * Stackra file contract:
 * Purpose: unit tests of `@Renamed(old)`: the class form records the old identity on a kind whose identity the
 *          manifest locks, the field form records the old field name on a shape, and a method or a class of no kind is
 *          refused.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 5, 6
 *                     and 22).
 */
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { Renamed } from "#core/decorators/renamed.decorator";

@Renamed("orders.OrderSummary")
class OrderView extends Schema {
  @Renamed("customersMayCancel")
  cancellable = true;

  total = 0;
}

describe("Renamed", () => {
  it("records the old identity of a class", () => {
    expect(Renamed.on(OrderView)).toBe("orders.OrderSummary");
  });

  it("records the old name of a field", () => {
    expect([...Renamed.members(OrderView)]).toEqual([["cancellable", "customersMayCancel"]]);
  });

  it("refuses a method", () => {
    expect(() => {
      class Wrong extends Schema {
        @Renamed("old")
        total(): number {
          return 0;
        }
      }
      return Wrong;
    }).toThrow(/@renamed decorates a field, not a method/);
  });

  it("refuses a class of no kind", () => {
    expect(() => {
      @Renamed("old")
      class Plain {}
      return Plain;
    }).toThrow(/@renamed may mark .*; Plain is of no kind/);
  });
});
