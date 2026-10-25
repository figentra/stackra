/**
 * Stackra file contract:
 * Purpose: unit tests of `chargeableWeight`: the greater of actual and dimensional weight, rounded up to the given
 *          increment, one gram by default, and the refusal of a bad increment.
 * Boundary: test only; factors and increments are arbitrary test inputs, never a carrier's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0363 (decision 9); ADR 0369 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import type { Parcel } from "#contracts/types/parcel.type";
import { chargeableWeight } from "#core/functions/chargeable-weight.function";

// 24 000 cm³: 6 000 g at a factor of 4 000.
const light: Parcel = { lengthMm: 400, widthMm: 300, heightMm: 200, weightG: 2_500 };

describe("chargeableWeight", () => {
  it("bills the dimensional weight of a light, bulky box", () => {
    expect(chargeableWeight(light, 4_000)).toBe(6_000);
  });

  it("bills the actual weight of a heavy, small box", () => {
    expect(chargeableWeight({ ...light, weightG: 9_001 }, 4_000)).toBe(9_001);
  });

  it("rounds up to the increment", () => {
    expect(chargeableWeight({ ...light, weightG: 9_001 }, 4_000, 500)).toBe(9_500);
    expect(chargeableWeight(light, 4_000, 500)).toBe(6_000);
  });

  it.each([0, -1, 0.5, Number.NaN])("refuses increment %s", (increment) => {
    expect(() => chargeableWeight(light, 4_000, increment)).toThrow(RangeError);
  });

  it("refuses what dimensionalWeight refuses", () => {
    expect(() => chargeableWeight(light, 0)).toThrow(RangeError);
  });
});
