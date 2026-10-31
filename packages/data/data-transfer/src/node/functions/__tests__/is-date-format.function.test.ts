/**
 * Stackra file contract:
 * Purpose: unit tests of `isDateFormat`: built-in date ids, custom codes with date parts, and codes whose only date
 *          letters are quoted, bracketed or escaped (STA-1736).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { isDateFormat } from "#node/functions/is-date-format.function";

describe("isDateFormat", () => {
  it("knows the built-in date ids", () => {
    expect([14, 22, 45, 57].map((id) => isDateFormat(id, undefined))).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect([0, 1, 2, 10, 49].map((id) => isDateFormat(id, undefined))).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("reads a custom code's parts", () => {
    expect(isDateFormat(164, "yyyy-mm-dd hh:mm:ss")).toBe(true);
    expect(isDateFormat(165, "[$-409]d/m/yyyy;@")).toBe(true);
    expect(isDateFormat(166, '#,##0.00 "days"')).toBe(false);
    expect(isDateFormat(167, "[Red]0.00")).toBe(false);
    expect(isDateFormat(168, "0\\h")).toBe(false);
    expect(isDateFormat(169, "General")).toBe(false);
  });
});
