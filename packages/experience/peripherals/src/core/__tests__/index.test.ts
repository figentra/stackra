/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the template's `PeripheralsConfig` and the memory drivers its
 *          generated desktop wiring imports (`MemoryReceiptPrinterDriver`, `MemoryCashDrawerDriver`,
 *          `MemoryBarcodeScannerDriver`), plus the shipped schema, the scale's memory driver and the print bridge's
 *          refusal, are exported, nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { PERIPHERALS_CONFIG_SCHEMA } from "#core/constants/peripherals-config-schema.constant";
import * as peripherals from "#core/index";

describe("@stackra/peripherals", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(peripherals).sort()).toEqual([
      "MemoryBarcodeScannerDriver",
      "MemoryCashDrawerDriver",
      "MemoryReceiptPrinterDriver",
      "MemoryScaleDriver",
      "PeripheralsConfig",
      "PeripheralsConfig$",
      "PrinterUnavailableError",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(peripherals.PeripheralsConfig$).toBe(PERIPHERALS_CONFIG_SCHEMA);
  });
});
