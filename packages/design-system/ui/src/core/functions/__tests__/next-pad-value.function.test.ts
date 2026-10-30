/**
 * Stackra file contract:
 * Purpose: proves `nextPadValue` appends digits, allows one separator only when asked, leads a bare separator with 0,
 *          deletes the last character, and refuses keys past the length limit.
 * Boundary: pure function test.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); wave 3c mobile interactions.
 */
import { nextPadValue } from "#core/functions/next-pad-value.function";

describe("nextPadValue", () => {
  it("appends a digit", () => {
    expect(nextPadValue("12", "3", {})).toBe("123");
  });

  it("takes one separator only with hasDecimal, after a 0 when empty", () => {
    expect(nextPadValue("", ".", { hasDecimal: true })).toBe("0.");
    expect(nextPadValue("4.5", ".", { hasDecimal: true })).toBeUndefined();
    expect(nextPadValue("4", ".", {})).toBeUndefined();
  });

  it("deletes the last character and refuses on empty", () => {
    expect(nextPadValue("45", "delete", {})).toBe("4");
    expect(nextPadValue("", "delete", {})).toBeUndefined();
  });

  it("refuses past maxLength and unknown keys", () => {
    expect(nextPadValue("1234", "5", { maxLength: 4 })).toBeUndefined();
    expect(nextPadValue("1", "x", {})).toBeUndefined();
  });
});
