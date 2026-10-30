/**
 * Stackra file contract:
 * Purpose: proves `pinDigitsOf` keeps Latin digits, reads Arabic-Indic and Persian digits, drops the rest and cuts to
 *          the length.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: gap inventory row 3; ADR 0022 (test placement).
 */
import { pinDigitsOf } from "#core/functions/pin-digits-of.function";

describe("pinDigitsOf", () => {
  it.each([
    ["1234", 4, "1234"],
    ["12a3-4", 4, "1234"],
    ["٠١٢٣٤٥٦٧٨٩", 10, "0123456789"],
    ["۰۱۲۳۴۵۶۷۸۹", 10, "0123456789"],
    ["١2٣4", 4, "1234"],
    ["123456", 4, "1234"],
    ["", 4, ""],
  ])("reads %j (length %i) as %j", (text, length, expected) => {
    expect(pinDigitsOf(text, length)).toBe(expected);
  });
});
