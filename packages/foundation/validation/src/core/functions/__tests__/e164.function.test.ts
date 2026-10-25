/**
 * Stackra file contract:
 * Purpose: unit tests of `e164()`: typed numbers with spaces, hyphens, parentheses, a `00` prefix and Arabic-Indic
 *          digits normalise to E.164; numbers without a country code, too short or too long are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ITU-T E.164.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import type { z } from "zod";

import { e164 } from "#core/functions/e164.function";
import type { E164 } from "#core/types/e164.type";

describe("e164()", () => {
  it.each([
    ["+966 50 000 0001", "+966500000001"],
    ["00971-50-123-4567", "+971501234567"],
    ["+20 (10) 1234.5678", "+201012345678"],
    ["+٩٦٦٥٠٠٠٠٠٠٠١", "+966500000001"],
  ])("normalises %s", (input, output) => {
    expect(e164().parse(input)).toBe(output);
  });

  it.each(["0500000001", "+0966500000001", "+1234", "+1234567890123456"])("refuses %s", (input) => {
    expect(e164().safeParse(input).success).toBe(false);
  });

  it("outputs E164", () => {
    expectTypeOf<z.output<ReturnType<typeof e164>>>().toEqualTypeOf<E164>();
  });
});
