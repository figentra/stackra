/**
 * Stackra file contract:
 * Purpose: unit tests of `platformConstant`: the closed set of `Duration.*` and `Money.*` constructors evaluated with
 *          the real implementations, the wire value and code each default carries, wrong argument types and
 *          callees outside the set refused, and a constructor's own refusal thrown.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { platformConstant } from "#core/functions/platform-constant.function";

describe("platformConstant", () => {
  it("evaluates durations to canonical ISO 8601", () => {
    expect(platformConstant("Duration.minutes", [5])).toEqual({
      value: "PT5M",
      code: 'duration("PT5M")',
      imports: [["duration", "@stackra/validation"]],
    });
    expect(platformConstant("Duration.parse", ["PT1H"])?.value).toBe("PT1H");
  });

  it("evaluates money to minor units", () => {
    expect(platformConstant("Money.of", ["12.50", "USD"])).toEqual({
      value: { minor: 1250, currency: "USD" },
      code: 'Money.ofMinor(1250, "USD")',
      imports: [["Money", "@stackra/money"]],
    });
    expect(platformConstant("Money.ofMinor", [99, "EUR"])?.value).toEqual({
      minor: 99,
      currency: "EUR",
    });
    expect(platformConstant("Money.zero", ["USD"])?.value).toEqual({ minor: 0, currency: "USD" });
  });

  it("refuses anything outside the set or with the wrong arguments", () => {
    expect(platformConstant("Date.now", [])).toBeUndefined();
    expect(platformConstant("Duration.minutes", ["5"])).toBeUndefined();
    expect(platformConstant("Money.of", [12.5, "USD"])).toBeUndefined();
    expect(() => platformConstant("Money.of", ["1.234", "USD"])).toThrow();
  });
});
