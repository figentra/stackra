/**
 * Stackra file contract:
 * Purpose: unit tests of `kickThroughPrinter`: it pulses the pin through a ready printer and refuses, without a pulse,
 *          exactly as a printer that is not ready refuses.
 * Boundary: test only; uses @stackra/peripherals' `memory` printer as the bound printer.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 5); ADR 0458 (decision 3); ADR 0022 (test placement).
 */
import { MemoryReceiptPrinterDriver } from "@stackra/peripherals";
import { describe, expect, it } from "@stackra/testing";

import { kickThroughPrinter } from "#core/functions/kick-through-printer.function";

describe("kickThroughPrinter", () => {
  it("pulses the pin through a ready printer", async () => {
    const printer = new MemoryReceiptPrinterDriver();
    expect(await kickThroughPrinter(printer, 5)).toEqual({ ok: true, data: undefined });
    expect(printer.kicks).toEqual([5]);
  });

  it("refuses without a pulse when the printer does not answer", async () => {
    const printer = new MemoryReceiptPrinterDriver();
    printer.isPresent = false;
    expect(await kickThroughPrinter(printer, 2)).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "print" },
    });
    expect(printer.kicks).toEqual([]);
  });
});
