/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: the Sunmi, PAX and iMin drivers the till's generated
 *          native wiring imports, and nothing else; the Sunmi and PAX printers live in @stackra/native-receipt-printer.
 * Boundary: test only; imports the stand-in barrel through its `#native` alias with no Expo modules registry present,
 *           so an eager native lookup would break the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0442 (decision 4); ADR 0478 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import * as native from "#native/index";

describe("@stackra/peripherals/native", () => {
  it("exports the drivers that have not moved to a native module package", () => {
    expect(Object.keys(native).sort()).toEqual([
      "IminBarcodeScannerDriver",
      "IminCashDrawerDriver",
      "IminReceiptPrinterDriver",
      "PaxBarcodeScannerDriver",
      "PaxCashDrawerDriver",
      "SunmiBarcodeScannerDriver",
      "SunmiCashDrawerDriver",
    ]);
  });
});
