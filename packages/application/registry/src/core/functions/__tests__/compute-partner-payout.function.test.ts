/**
 * Stackra file contract:
 * Purpose: unit tests of `computePartnerPayout`: the rate rounded half up to a minor unit plus the fixed fee, the fee
 *          capped at the gross, exact amounts past the safe-integer product, and bad inputs refused.
 * Boundary: test only; the rates are test data, not a shipped schedule.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0355 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { computePartnerPayout } from "#core/functions/compute-partner-payout.function";

describe("computePartnerPayout", () => {
  it("applies the rate, half up, plus the fixed fee", () => {
    expect(computePartnerPayout(10_005, { basisPoints: 2_000, fixedMinor: 0 })).toEqual({
      grossMinor: 10_005,
      feeMinor: 2_001,
      netMinor: 8_004,
    });
    expect(computePartnerPayout(10_002, { basisPoints: 2_000, fixedMinor: 100 })).toEqual({
      grossMinor: 10_002,
      feeMinor: 2_100,
      netMinor: 7_902,
    });
  });

  it("never keeps more than the gross", () => {
    expect(computePartnerPayout(50, { basisPoints: 1_000, fixedMinor: 100 })).toEqual({
      grossMinor: 50,
      feeMinor: 50,
      netMinor: 0,
    });
  });

  it("stays exact on large grosses", () => {
    const gross = Number.MAX_SAFE_INTEGER;
    const { feeMinor, netMinor } = computePartnerPayout(gross, {
      basisPoints: 9_999,
      fixedMinor: 0,
    });
    expect(BigInt(feeMinor)).toBe((BigInt(gross) * 9_999n + 5_000n) / 10_000n);
    expect(feeMinor + netMinor).toBe(gross);
  });

  it("refuses bad amounts and rates", () => {
    expect(() => computePartnerPayout(-1, { basisPoints: 0, fixedMinor: 0 })).toThrow(RangeError);
    expect(() => computePartnerPayout(1.5, { basisPoints: 0, fixedMinor: 0 })).toThrow(RangeError);
    expect(() => computePartnerPayout(1, { basisPoints: 10_001, fixedMinor: 0 })).toThrow(
      RangeError,
    );
    expect(() => computePartnerPayout(1, { basisPoints: 0, fixedMinor: -1 })).toThrow(RangeError);
  });
});
