/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: the Sunmi, PAX and iMin drivers the till's generated
 *          native wiring imports, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#native` alias with no Expo modules registry present,
 *           so an eager native lookup would break the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0442 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import * as native from "#native/index";

describe("@stackra/peripherals/native", () => {
  it("exports the three families' printer, drawer and scanner drivers", () => {
    expect(Object.keys(native).sort()).toEqual([
      "IminBarcodeScannerDriver",
      "IminCashDrawerDriver",
      "IminReceiptPrinterDriver",
      "PaxBarcodeScannerDriver",
      "PaxCashDrawerDriver",
      "PaxReceiptPrinterDriver",
      "SunmiBarcodeScannerDriver",
      "SunmiCashDrawerDriver",
      "SunmiReceiptPrinterDriver",
    ]);
  });
});
