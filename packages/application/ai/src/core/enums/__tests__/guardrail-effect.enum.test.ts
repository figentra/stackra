/**
 * Stackra file contract:
 * Purpose: unit and type tests of `GuardrailEffect`: an `Enum.of` enum holding block, redact and flag in source order,
 *          with a same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0156 (decision 4); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { GuardrailEffect } from "#core/enums/guardrail-effect.enum";

describe("GuardrailEffect", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(GuardrailEffect)).toEqual(["block", "redact", "flag"]);
  });

  it("types its values", () => {
    expectTypeOf<GuardrailEffect>().toEqualTypeOf<"block" | "redact" | "flag">();
  });
});
