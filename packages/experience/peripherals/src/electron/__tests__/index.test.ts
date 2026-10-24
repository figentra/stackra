/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./electron` entry: `PrintReceiptBridge` and the three main-process drivers the
 *          template's desktop wiring imports, and loading it imports no Electron module.
 * Boundary: test only; imports the stand-in barrel through its `#electron` alias with `electron` mocked to fail on
 *           load, so an eager import would break the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0127 2026-10-24 note; ADR 0253.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as electron from "#electron/index";

vi.mock("electron", () => {
  throw new Error("the ./electron entry must not load Electron eagerly");
});

describe("@stackra/peripherals/electron", () => {
  it("exports the print bridge and the main-process drivers", () => {
    expect(Object.keys(electron).sort()).toEqual([
      "EscposReceiptPrinterDriver",
      "HidBarcodeScannerDriver",
      "PrintReceiptBridge",
      "PrinterKickCashDrawerDriver",
    ]);
  });
});
