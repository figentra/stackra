/**
 * Stackra file contract:
 * Purpose: unit tests of `BARCODE_DETECTOR_FORMATS`: each port format maps to the Shape Detection API's name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { BARCODE_DETECTOR_FORMATS } from "#browser/constants/barcode-detector-formats.constant";

describe("BARCODE_DETECTOR_FORMATS", () => {
  it("maps the port's names to BarcodeDetector's", () => {
    expect(BARCODE_DETECTOR_FORMATS.ean13).toBe("ean_13");
    expect(BARCODE_DETECTOR_FORMATS.qr).toBe("qr_code");
    expect(Object.keys(BARCODE_DETECTOR_FORMATS)).toHaveLength(11);
    expect(Object.isFrozen(BARCODE_DETECTOR_FORMATS)).toBe(true);
  });
});
