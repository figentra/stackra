/**
 * Stackra file contract:
 * Purpose: unit tests of `normalizeIdentifier`, the one form an identifier is checked and stored in: spaces and hyphens
 *          removed, letters upper-cased, Arabic-Indic and Eastern Arabic-Indic (Persian) digits read as Latin digits,
 *          and nothing else changed.
 * Boundary: test only; the function is pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0192 (decision 2: Latin digits stored).
 */
import { describe, expect, it } from "@stackra/testing";

import { normalizeIdentifier } from "#core/functions/normalize-identifier.function";

describe(normalizeIdentifier, () => {
  it("removes spaces and hyphens", () => {
    expect(normalizeIdentifier("784-1990-1234567-1")).toBe("784199012345671");
    expect(normalizeIdentifier(" 784 1990\t1234567 1 ")).toBe("784199012345671");
  });

  it("upper-cases letters", () => {
    expect(normalizeIdentifier("sa03 8000 abcd")).toBe("SA038000ABCD");
  });

  it("reads Arabic-Indic digits as Latin digits", () => {
    expect(normalizeIdentifier("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  it("reads Eastern Arabic-Indic (Persian) digits as Latin digits", () => {
    expect(normalizeIdentifier("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
  });

  it("reads both digit sets in one value, with Latin digits and letters beside them", () => {
    expect(normalizeIdentifier("ab-١٢٣-۴۵۶-789")).toBe("AB123456789");
  });

  it("changes nothing else: a dot, a slash and an underscore stay for the pattern to refuse", () => {
    expect(normalizeIdentifier("12.34/56_78")).toBe("12.34/56_78");
    expect(normalizeIdentifier("")).toBe("");
  });
});
