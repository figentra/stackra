/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyQr`: an SVG document, the same for the same URL and different for another.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { verifyQr } from "#core/functions/verify-qr.function";

describe(verifyQr, () => {
  it("draws a URL as an SVG QR code, deterministically", () => {
    const svg = verifyQr("https://verify.example.com/awards/abc");
    expect(svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
    expect(verifyQr("https://verify.example.com/awards/abc")).toBe(svg);
    expect(verifyQr("https://verify.example.com/awards/abd")).not.toBe(svg);
  });
});
