/**
 * Stackra file contract:
 * Purpose: proves `PrinterKickCashDrawerDriver` answers as its printer does, pulses the configured pin only through a
 *          ready printer, and refuses without a pulse when the printer does not answer; and that it opens through
 *          @stackra/native-receipt-printer's Epson driver on a stand-in `StackraReceiptPrinter` module.
 * Boundary: test only; the bound printer is @stackra/peripherals' `memory` driver or the Epson driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 5); ADR 0458 (decision 3); ADR 0022 (test placement).
 */
import { vi } from "vitest";

import { EpsonReceiptPrinterDriver } from "@stackra/native-receipt-printer";
import type { PeripheralsConfig } from "@stackra/peripherals";
import { MemoryReceiptPrinterDriver } from "@stackra/peripherals";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { PrinterKickCashDrawerDriver } from "#core/drivers/printer-kick-cash-drawer.driver";

const REFUSED = { ok: false, error: { code: "unavailable", capability: "print" } };

/** A configuration with only the fields the drivers read. */
function configWith(drawerPin: 2 | 5, printerAddress = ""): PeripheralsConfig {
  return { drawerPin, printerAddress } as PeripheralsConfig;
}

describe("PrinterKickCashDrawerDriver", () => {
  afterEach(() => {
    delete (globalThis as { expo?: unknown }).expo;
  });

  it("pulses the configured pin through a ready printer", async () => {
    const printer = new MemoryReceiptPrinterDriver();
    const drawer = new PrinterKickCashDrawerDriver(printer, configWith(5));
    expect(await drawer.probe()).toEqual({ ok: true, data: undefined });
    expect(await drawer.open()).toEqual({ ok: true, data: undefined });
    expect(printer.kicks).toEqual([5]);
  });

  it("refuses without a pulse when the printer does not answer", async () => {
    const printer = new MemoryReceiptPrinterDriver();
    printer.isPresent = false;
    const drawer = new PrinterKickCashDrawerDriver(printer, configWith(2));
    expect(await drawer.probe()).toEqual(REFUSED);
    expect(await drawer.open()).toEqual(REFUSED);
    expect(printer.kicks).toEqual([]);
  });

  it("checks the Epson printer's status before the pulse", async () => {
    const status = vi.fn(async () => 1);
    const kickDrawer = vi.fn(async () => undefined);
    (globalThis as { expo?: unknown }).expo = {
      modules: { StackraReceiptPrinter: { status, printLines: vi.fn(), kickDrawer } },
    };
    const config = configWith(2, "tcp://10.0.0.20:9100");
    const drawer = new PrinterKickCashDrawerDriver(new EpsonReceiptPrinterDriver(config), config);
    expect(await drawer.open()).toEqual({ ok: true, data: undefined });
    expect(status).toHaveBeenCalledWith("epson", "TCP:10.0.0.20");
    expect(kickDrawer).toHaveBeenCalledWith("epson", "TCP:10.0.0.20", 2);
    status.mockResolvedValueOnce(0);
    expect(await drawer.open()).toEqual(REFUSED);
    expect(kickDrawer).toHaveBeenCalledTimes(1);
  });
});
