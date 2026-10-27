/**
 * Stackra file contract:
 * Purpose: proves `PaxBarcodeScannerDriver` refuses with capability `scanner` without its family's
 *          module, and hands each recorded decoded code to the listener until it stops.
 * Boundary: test only; replays the recorded pax SDK fixture through a stand-in `StackraPax` Expo module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0459; ADR 0442 (decision 4); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PaxBarcodeScannerDriver } from "#native/drivers/pax-barcode-scanner.driver";
import { POS_DEVICE_SDK } from "#native/__tests__/pos-device-sdk.fixture";

describe("PaxBarcodeScannerDriver", () => {
  afterEach(POS_DEVICE_SDK.uninstall);

  it("refuses without the module", async () => {
    expect(await new PaxBarcodeScannerDriver().probe()).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "scanner" },
    });
  });

  it("hands decoded codes to the listener until it stops", async () => {
    const device = POS_DEVICE_SDK.install("StackraPax", 0);
    const scanner = new PaxBarcodeScannerDriver();
    expect(await scanner.probe()).toEqual({ ok: true, data: undefined });
    const listener = vi.fn();
    const stop = scanner.onScan(listener);
    device.emit(POS_DEVICE_SDK.scan.ean13);
    device.emit(POS_DEVICE_SDK.scan.notText);
    expect(listener.mock.calls).toEqual([[POS_DEVICE_SDK.scan.ean13.code]]);
    stop();
    expect(device.remove).toHaveBeenCalledTimes(1);
  });
});
