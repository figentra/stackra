/**
 * Stackra file contract:
 * Purpose: unit tests of `computePartnerPayout`: the rate rounded half up to a minor unit plus the fixed fee, the fee
 *          capped at the gross, exact amounts past the safe-integer product, and bad inputs refused.
 * Boundary: test only; the rates are test data, not a shipped schedule.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0355 (decision 8); STA-1383 (MoneyAmount).
 */
import { describe, expect, it } from "@stackra/testing";

import { computePartnerPayout } from "#core/functions/compute-partner-payout.function";

/** An amount in SAR minor units. */
const sar = (minor: number) => ({ minor, currency: "SAR" });

describe("computePartnerPayout", () => {
  it("applies the rate, half up, plus the fixed fee", () => {
    expect(computePartnerPayout(sar(10_005), { basisPoints: 2_000, fixedMinor: 0 })).toEqual({
      gross: sar(10_005),
      fee: sar(2_001),
      net: sar(8_004),
    });
    expect(computePartnerPayout(sar(10_002), { basisPoints: 2_000, fixedMinor: 100 })).toEqual({
      gross: sar(10_002),
      fee: sar(2_100),
      net: sar(7_902),
    });
  });

  it("never keeps more than the gross", () => {
    expect(computePartnerPayout(sar(50), { basisPoints: 1_000, fixedMinor: 100 })).toEqual({
      gross: sar(50),
      fee: sar(50),
      net: sar(0),
    });
  });

  it("stays exact on large grosses", () => {
    const gross = Number.MAX_SAFE_INTEGER;
    const { fee, net } = computePartnerPayout(sar(gross), {
      basisPoints: 9_999,
      fixedMinor: 0,
    });
    expect(BigInt(fee.minor)).toBe((BigInt(gross) * 9_999n + 5_000n) / 10_000n);
    expect(fee.minor + net.minor).toBe(gross);
  });

  it("refuses bad amounts and rates", () => {
    expect(() => computePartnerPayout(sar(-1), { basisPoints: 0, fixedMinor: 0 })).toThrow(RangeError);
    expect(() => computePartnerPayout(sar(1.5), { basisPoints: 0, fixedMinor: 0 })).toThrow(RangeError);
    expect(() => computePartnerPayout(sar(1), { basisPoints: 10_001, fixedMinor: 0 })).toThrow(
      RangeError,
    );
    expect(() => computePartnerPayout(sar(1), { basisPoints: 0, fixedMinor: -1 })).toThrow(RangeError);
  });
});
