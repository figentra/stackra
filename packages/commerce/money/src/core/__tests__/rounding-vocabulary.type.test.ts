/**
 * Stackra file contract:
 * Purpose: pins the one rounding vocabulary: every `QuantityRounding` code of `@stackra/support` is a `Rounding` code
 *          of `@stackra/contracts`, the enum money rounds with, so a mode passes from a quantity to money unchanged.
 * Boundary: test only; compile-time assertions plus the runtime codes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0220 (decision 3); STA-1383 (one rounding vocabulary).
 */
import { Enum, Rounding } from "@stackra/contracts";
import type { QuantityRounding } from "@stackra/support";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

describe("the rounding vocabulary", () => {
  it("makes every quantity rounding a money rounding", () => {
    expectTypeOf<QuantityRounding>().toMatchTypeOf<Rounding>();
    const modes: readonly QuantityRounding[] = ["half_up", "down", "up"];
    for (const mode of modes) expect(Enum.values(Rounding)).toContain(mode);
  });
});
