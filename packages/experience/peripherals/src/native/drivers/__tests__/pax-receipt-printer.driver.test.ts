/**
 * Stackra file contract:
 * Purpose: proves `PaxReceiptPrinterDriver` prints through its family's module, kicks the drawer
 *          whatever the pin, and refuses with capability `print` without the module or out of paper.
 * Boundary: test only; replays the recorded pax SDK fixture through a stand-in `StackraPax` Expo module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0459; ADR 0442 (decision 4); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { PaxReceiptPrinterDriver } from "#native/drivers/pax-receipt-printer.driver";
import { POS_DEVICE_SDK } from "#native/__tests__/pos-device-sdk.fixture";

const STATUS = POS_DEVICE_SDK.status.pax;
const REFUSED = { ok: false, error: { code: "unavailable", capability: "print" } };

describe("PaxReceiptPrinterDriver", () => {
  afterEach(POS_DEVICE_SDK.uninstall);

  it("refuses without the module", async () => {
    expect(await new PaxReceiptPrinterDriver().probe()).toEqual(REFUSED);
  });

  it("prints and kicks the drawer on a ready printer", async () => {
    const device = POS_DEVICE_SDK.install("StackraPax", STATUS.ready);
    const printer = new PaxReceiptPrinterDriver();
    expect(await printer.probe()).toEqual({ ok: true, data: undefined });
    expect(await printer.print({ orderId: "ord_1", lines: ["Total 12.00"] })).toEqual({
      ok: true,
      data: { printer: "pax", orderId: "ord_1" },
    });
    expect(device.printLines).toHaveBeenCalledWith(["Total 12.00"]);
    expect(await printer.kickDrawer(5)).toEqual({ ok: true, data: undefined });
    expect(device.openDrawer).toHaveBeenCalledTimes(1);
  });

  it("refuses out of paper", async () => {
    POS_DEVICE_SDK.install("StackraPax", STATUS.outOfPaper);
    expect(await new PaxReceiptPrinterDriver().print({ orderId: "ord_1", lines: [] })).toEqual(
      REFUSED,
    );
  });
});
