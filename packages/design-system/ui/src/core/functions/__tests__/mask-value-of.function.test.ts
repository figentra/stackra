/**
 * Stackra file contract:
 * Purpose: proves `maskValueOf` writes the mask's literals, skips refused characters, reads Arabic-Indic digits,
 *          upper-cases `A` slots and never ends in a separator, and `maskCaretOf` puts the caret after the n-th raw
 *          character.
 * Boundary: pure functions.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave C).
 */
import { maskCaretOf } from "#core/functions/mask-caret-of.function";
import { maskEditOf } from "#core/functions/mask-edit-of.function";
import { maskValueOf } from "#core/functions/mask-value-of.function";

describe("maskValueOf", () => {
  it("writes literals between the slots and stops after the last raw character", () => {
    expect(maskValueOf("999 999 9999", "0501234567")).toEqual({
      text: "050 123 4567",
      raw: "0501234567",
    });
    expect(maskValueOf("999 999 9999", "050")).toEqual({ text: "050", raw: "050" });
    expect(maskValueOf("99/99", "12/")).toEqual({ text: "12", raw: "12" });
  });

  it("reads Arabic-Indic digits, skips refused characters and upper-cases A slots", () => {
    expect(maskValueOf("9999 9999", "١٢٣٤x٥")).toEqual({ text: "1234 5", raw: "12345" });
    expect(maskValueOf("AA99 9999", "sa0380")).toEqual({ text: "SA03 80", raw: "SA0380" });
  });
});

describe("maskEditOf", () => {
  it("keeps the caret after the character it followed when typing in the middle", () => {
    // "050 123" with "9" typed after "05".
    expect(maskEditOf("999 999 9999", "050123", "0590 123", 3)).toEqual({
      raw: "0590123",
      text: "059 012 3",
      caret: 3,
    });
  });

  it("deletes the character before a separator that was backspaced", () => {
    // "050 123" with the space backspaced: the caret was after it, at 4.
    expect(maskEditOf("999 999 9999", "050123", "050123", 3)).toEqual({
      raw: "05123",
      text: "051 23",
      caret: 2,
    });
  });
});

describe("maskCaretOf", () => {
  it("puts the caret after the n-th raw character", () => {
    expect(maskCaretOf("999 999", 0)).toBe(0);
    expect(maskCaretOf("999 999", 3)).toBe(3);
    expect(maskCaretOf("999 999", 4)).toBe(5);
    expect(maskCaretOf("(999)", 3)).toBe(4);
  });
});
