/**
 * Stackra file contract:
 * Purpose: unit tests of `DecoratorTarget`: an `Enum.of` value with the three snake_case targets in source order and a
 *          same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 6
 *                     and 16 Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DecoratorTarget } from "#core/enums/decorator-target.enum";

describe("DecoratorTarget", () => {
  it("lists the class, field and method targets", () => {
    expect(Enum.values(DecoratorTarget)).toEqual(["class", "field", "method"]);
    expectTypeOf<DecoratorTarget>().toEqualTypeOf<"class" | "field" | "method">();
  });
});
