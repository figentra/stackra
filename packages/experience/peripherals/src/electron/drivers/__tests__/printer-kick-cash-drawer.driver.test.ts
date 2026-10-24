/**
 * Stackra file contract:
 * Purpose: unit tests of `PrinterKickCashDrawerDriver`: opening pulses the configured pin through the bound printer,
 *          and the drawer probes and refuses exactly as that printer does.
 * Boundary: test only; the printer is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0253 (decision 4).
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { PeripheralsConfig } from "#config/peripherals.config";
import { CashDrawer } from "#contracts/ports/cash-drawer.port";
import { MemoryReceiptPrinterDriver } from "#core/drivers/memory-receipt-printer.driver";
import { PrinterKickCashDrawerDriver } from "#electron/drivers/printer-kick-cash-drawer.driver";

describe("PrinterKickCashDrawerDriver", () => {
  it("pulses the configured pin through the printer", async () => {
    const printer = new MemoryReceiptPrinterDriver();
    const config = buildConfig(PeripheralsConfig, { values: { drawerPin: 5 } });
    const drawer = new PrinterKickCashDrawerDriver(printer, config);
    expect(drawer).toBeInstanceOf(CashDrawer);
    expect(await drawer.probe()).toEqual({ ok: true, data: undefined });
    expect(await drawer.open()).toEqual({ ok: true, data: undefined });
    expect(printer.kicks).toEqual([5]);
  });

  it("refuses as its printer does", async () => {
    const printer = new MemoryReceiptPrinterDriver();
    printer.isPresent = false;
    const drawer = new PrinterKickCashDrawerDriver(printer, buildConfig(PeripheralsConfig));
    const refused = { ok: false, error: { code: "unavailable", capability: "print" } };
    expect(await drawer.probe()).toEqual(refused);
    expect(await drawer.open()).toEqual(refused);
  });
});
