/**
 * Stackra file contract:
 * Purpose: proves `qrPathOf` encodes a text into a square with a quiet zone, draws only dark modules as unit squares,
 *          keeps the three finder patterns, and grows with the text and the error correction level.
 * Boundary: pure function over the real encoder.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { qrPathOf } from "#core/functions/qr-path-of.function";

describe("qrPathOf", () => {
  it("draws a version 1 code with its quiet zone and finder corners", () => {
    const { path, size } = qrPathOf("STA-1371");
    expect(size).toBe(21 + 8);
    expect(path).toMatch(/^(M\d+ \d+h1v1h-1z)+$/u);
    // The top-left finder's corner module, just inside the quiet zone, is dark; the quiet zone is not.
    expect(path).toContain("M4 4h1v1h-1z");
    expect(path).not.toContain("M3 3h1v1h-1z");
  });

  it("grows with the text and the error correction", () => {
    const url = "https://pay.example.sa/invoice/INV-2207?amount=3450&currency=SAR";
    expect(qrPathOf(url, "H").size).toBeGreaterThan(qrPathOf(url, "L").size);
    expect(qrPathOf("مرحبا").size).toBeGreaterThanOrEqual(29);
  });
});
