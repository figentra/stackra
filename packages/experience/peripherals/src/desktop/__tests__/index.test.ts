/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./desktop` entry: `PrintReceiptBridge` and the main-process drivers (the `ecr` card terminal link among them) the
 *          template's desktop wiring imports, and loading it imports no Electron module.
 * Boundary: test only; imports the stand-in barrel through its `#desktop` alias with `electron` mocked to fail on
 *           load, so an eager import would break the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0127 2026-10-24 note; ADR 0253.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as electron from "#desktop/index";

vi.mock("electron", () => {
  throw new Error("the ./desktop entry must not load Electron eagerly");
});

describe("@stackra/peripherals/desktop", () => {
  it("exports the print bridges and the main-process drivers", () => {
    expect(Object.keys(electron).sort()).toEqual([
      "EcrCardTerminalDriver",
      "EscposKitchenPrinterDriver",
      "EscposReceiptPrinterDriver",
      "HidBarcodeScannerDriver",
      "HidBumpBarDriver",
      "PrintKitchenTicketBridge",
      "PrintLabelBridge",
      "PrintReceiptBridge",
      "PrinterKickCashDrawerDriver",
      "ZplLabelPrinterDriver",
    ]);
  });
});
