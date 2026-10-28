/**
 * Stackra file contract:
 * Purpose: proves `SunmiReceiptPrinterDriver` prints and pulses the drawer through the module with an empty target, and
 *          refuses with capability `print` without the module, out of paper, or when the module rejects.
 * Boundary: test only; replays the recorded sunmi SDK fixture through a stand-in `StackraReceiptPrinter` Expo module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 5); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { RECEIPT_PRINTER_SDK } from "#core/__tests__/receipt-printer-sdk.fixture";
import { SunmiReceiptPrinterDriver } from "#core/drivers/sunmi-receipt-printer.driver";

const STATUS = RECEIPT_PRINTER_SDK.status.sunmi;
const REFUSED = { ok: false, error: { code: "unavailable", capability: "print" } };

describe("SunmiReceiptPrinterDriver", () => {
  afterEach(RECEIPT_PRINTER_SDK.uninstall);

  it("refuses without the module", async () => {
    const printer = new SunmiReceiptPrinterDriver();
    expect(await printer.probe()).toEqual(REFUSED);
    expect(await printer.kickDrawer(2)).toEqual(REFUSED);
  });

  it("prints and kicks the drawer on a ready printer", async () => {
    const module = RECEIPT_PRINTER_SDK.install(STATUS.ready);
    const printer = new SunmiReceiptPrinterDriver();
    expect(await printer.probe()).toEqual({ ok: true, data: undefined });
    expect(await printer.print({ orderId: "ord_1", lines: ["Total 12.00"] })).toEqual({
      ok: true,
      data: { printer: "sunmi", orderId: "ord_1" },
    });
    expect(module.printLines).toHaveBeenCalledWith("sunmi", "", ["Total 12.00"]);
    expect(await printer.kickDrawer(5)).toEqual({ ok: true, data: undefined });
    expect(module.kickDrawer).toHaveBeenCalledWith("sunmi", "", 5);
  });

  it("refuses out of paper and on a fault", async () => {
    for (const status of [STATUS.outOfPaper, STATUS.fault]) {
      RECEIPT_PRINTER_SDK.install(status);
      expect(await new SunmiReceiptPrinterDriver().print({ orderId: "ord_1", lines: [] })).toEqual(
        REFUSED,
      );
    }
  });

  it("refuses when the module rejects the print", async () => {
    const module = RECEIPT_PRINTER_SDK.install(STATUS.ready);
    module.printLines.mockRejectedValueOnce(new Error("paper jam"));
    expect(await new SunmiReceiptPrinterDriver().print({ orderId: "ord_1", lines: ["x"] })).toEqual(
      REFUSED,
    );
  });
});
