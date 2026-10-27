/**
 * Stackra file contract:
 * Purpose: unit tests of `ocrLines`: boxes grouped into rows top to bottom, Arabic rows right to left, Latin rows left
 *          to right, a mixed row by its majority script, empty boxes dropped, and the engine's order without boxes.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0192; STA-789.
 */
import { describe, expect, it } from "@stackra/testing";

import { ocrLines } from "#node/functions/ocr-lines.function";

describe("ocrLines", () => {
  it("reads an Arabic row right to left and rows top to bottom", () => {
    expect(
      ocrLines(
        ["رقم", "العقد", "Invoice", "2026"],
        [
          [120, 12, 180, 30],
          [200, 10, 260, 32],
          [10, 50, 90, 70],
          [100, 52, 150, 70],
        ],
      ),
    ).toBe("العقد رقم\nInvoice 2026");
  });

  it("orders a mixed row by its majority script", () => {
    expect(
      ocrLines(
        ["123", "فاتورة ضريبية"],
        [
          [10, 0, 40, 20],
          [60, 0, 200, 20],
        ],
      ),
    ).toBe("فاتورة ضريبية 123");
  });

  it("drops empty boxes", () => {
    expect(
      ocrLines(
        ["a", " "],
        [
          [0, 0, 5, 5],
          [6, 0, 9, 5],
        ],
      ),
    ).toBe("a");
  });

  it("keeps the engine's order without boxes", () => {
    expect(ocrLines(["one", "two"])).toBe("one\ntwo");
  });
});
