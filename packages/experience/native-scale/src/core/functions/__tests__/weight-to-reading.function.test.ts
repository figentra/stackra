/**
 * Stackra file contract:
 * Purpose: proves `weightToReading` keeps exactly the port's `ScaleReading` fields (grams and the stable flag), and
 *          the guards `isWeightOrFault` and `isTareOrFault` accept their kinds.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { isTareOrFault } from "#core/functions/is-tare-or-fault.function";
import { isWeightOrFault } from "#core/functions/is-weight-or-fault.function";
import { weightToReading } from "#core/functions/weight-to-reading.function";

describe("weightToReading", () => {
  it("keeps grams and the stable flag", () => {
    expect(
      weightToReading({
        kind: "weight",
        value: 1.25,
        unit: "kg",
        grams: 1250,
        isStable: false,
        isNet: true,
      }),
    ).toEqual({ grams: 1250, isStable: false });
  });

  it("guards the request kinds", () => {
    const fault = { kind: "fault", fault: "busy" } as const;
    const tare = { kind: "tare", grams: 150 } as const;
    expect(isWeightOrFault(fault)).toBe(true);
    expect(isWeightOrFault(tare)).toBe(false);
    expect(isTareOrFault(tare)).toBe(true);
    expect(isTareOrFault(fault)).toBe(true);
  });
});
