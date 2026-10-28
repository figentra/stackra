/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the four vendor drivers the generated native wiring imports and the
 *          drawer kick @stackra/native-cash-drawer uses, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias with no Expo modules registry present,
 *           so an eager native lookup would break the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0478 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import * as entry from "#core/index";

describe("@stackra/native-receipt-printer", () => {
  it("exports the four vendor drivers and kickThroughPrinter", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "EpsonReceiptPrinterDriver",
      "PaxReceiptPrinterDriver",
      "StarReceiptPrinterDriver",
      "SunmiReceiptPrinterDriver",
      "kickThroughPrinter",
    ]);
  });
});
