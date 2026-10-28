/**
 * Stackra file contract:
 * Purpose: proves `EpsonReceiptPrinterDriver` prints and pulses the drawer through the module at the configured network
 *          address with the vendor's target spelling, and refuses with capability `print` without the module, without
 *          a network address, or on a printer fault.
 * Boundary: test only; replays the recorded epson SDK fixture through a stand-in `StackraReceiptPrinter` Expo module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 5); ADR 0253 (decision 4); ADR 0022 (test placement).
 */
import type { PeripheralsConfig } from "@stackra/peripherals";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { RECEIPT_PRINTER_SDK } from "#core/__tests__/receipt-printer-sdk.fixture";
import { EpsonReceiptPrinterDriver } from "#core/drivers/epson-receipt-printer.driver";

const STATUS = RECEIPT_PRINTER_SDK.status.epson;
const REFUSED = { ok: false, error: { code: "unavailable", capability: "print" } };

/** A configuration with only the address the driver reads. */
function configAt(printerAddress: string): PeripheralsConfig {
  return { printerAddress } as PeripheralsConfig;
}

describe("EpsonReceiptPrinterDriver", () => {
  afterEach(RECEIPT_PRINTER_SDK.uninstall);

  it("refuses without the module", async () => {
    expect(await new EpsonReceiptPrinterDriver(configAt("tcp://10.0.0.20:9100")).probe()).toEqual(
      REFUSED,
    );
  });

  it("refuses without a network address, before calling the module", async () => {
    const module = RECEIPT_PRINTER_SDK.install(STATUS.ready);
    for (const address of ["", "/dev/usb/lp0"]) {
      const printer = new EpsonReceiptPrinterDriver(configAt(address));
      expect(await printer.probe()).toEqual(REFUSED);
      expect(await printer.kickDrawer(2)).toEqual(REFUSED);
    }
    expect(module.status).not.toHaveBeenCalled();
    expect(module.kickDrawer).not.toHaveBeenCalled();
  });

  it("prints text without control characters and pulses the pin on a ready printer", async () => {
    const module = RECEIPT_PRINTER_SDK.install(STATUS.ready);
    const printer = new EpsonReceiptPrinterDriver(configAt("tcp://10.0.0.20:9100"));
    expect(await printer.probe()).toEqual({ ok: true, data: undefined });
    expect(
      await printer.print({ orderId: "ord_1", lines: ["Total 12.00\u001bp", "شكرا"] }),
    ).toEqual({
      ok: true,
      data: { printer: "epson", orderId: "ord_1" },
    });
    expect(module.status).toHaveBeenCalledWith("epson", "TCP:10.0.0.20");
    expect(module.printLines).toHaveBeenCalledWith("epson", "TCP:10.0.0.20", [
      "Total 12.00p",
      "شكرا",
    ]);
    expect(await printer.kickDrawer(5)).toEqual({ ok: true, data: undefined });
    expect(module.kickDrawer).toHaveBeenCalledWith("epson", "TCP:10.0.0.20", 5);
  });

  it("refuses on a printer fault and when the module rejects", async () => {
    const module = RECEIPT_PRINTER_SDK.install(STATUS.fault);
    const printer = new EpsonReceiptPrinterDriver(configAt("tcp://10.0.0.20:9100"));
    expect(await printer.print({ orderId: "ord_1", lines: [] })).toEqual(REFUSED);
    expect(module.printLines).not.toHaveBeenCalled();
    module.kickDrawer.mockRejectedValueOnce(new Error("offline"));
    expect(await printer.kickDrawer(2)).toEqual(REFUSED);
  });
});
