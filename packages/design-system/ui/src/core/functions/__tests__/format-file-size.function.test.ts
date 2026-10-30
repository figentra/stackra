/**
 * Stackra file contract:
 * Purpose: proves `formatFileSize` picks the largest fitting unit in powers of 1024, keeps one decimal at most, never
 *          goes negative and writes the locale's digits.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
import { formatFileSize } from "#core/functions/format-file-size.function";

describe("formatFileSize", () => {
  it.each([
    [0, "0 byte"],
    [512, "512 byte"],
    [1024, "1 kB"],
    [2_516_582, "2.4 MB"],
    [5 * 1024 ** 3, "5 GB"],
    [3 * 1024 ** 4, "3,072 GB"],
    [-5, "0 byte"],
  ])("writes %d bytes as %j in English", (bytes, expected) => {
    expect(formatFileSize(bytes, "en")).toBe(expected);
  });

  it("writes Arabic-Indic digits in Arabic", () => {
    expect(formatFileSize(2_516_582, "ar-EG")).toMatch(/٢٫٤/u);
  });
});
