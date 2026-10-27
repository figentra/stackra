/**
 * Stackra file contract:
 * Purpose: unit and type tests of `@Num`: it records bounds and `exclusiveMin`, records `{}` when written bare, takes
 *          a number list or map with `each: true`, is typed against its field and is refused outside the shape kinds.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 4, 6
 *                     and 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { Num } from "#core/decorators/num.decorator";

class LoyaltyOptions extends Schema {
  @Num({ exclusiveMin: 0 })
  earnPerMinor = 0.01;

  @Num({
    min: 0,
    max: 1,
    each: true,
  })
  weights: number[] = [];

  @Num({
    min: 0,
    each: true,
  })
  rates: Record<string, number> = {};

  @Num
  ratio = 0.5;
}

describe("Num", () => {
  it("records its options per field, and {} when written bare", () => {
    const members = Num.members(LoyaltyOptions);
    expect(members.get("earnPerMinor")).toEqual({ exclusiveMin: 0 });
    expect(members.get("weights")).toEqual({ min: 0, max: 1, each: true });
    expect(members.get("rates")).toEqual({ min: 0, each: true });
    expect(members.get("ratio")).toEqual({});
  });

  it("is refused by tsc on a string", () => {
    class Wrong extends Schema {
      // @ts-expect-error -- @Num on a string field
      @Num({ min: 0 })
      ratio!: string;
    }
    expect(Num.members(Wrong).get("ratio")).toEqual({ min: 0 });
  });

  it("refuses a class of no shape kind when it is defined", () => {
    expect(() => {
      class Plain {
        @Num({ min: 0 })
        ratio = 0.5;
      }
      return Plain;
    }).toThrow(/@num may mark .*; Plain is of no kind/);
  });
});
