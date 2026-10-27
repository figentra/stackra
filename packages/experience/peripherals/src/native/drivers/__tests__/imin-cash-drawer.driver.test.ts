/**
 * Stackra file contract:
 * Purpose: proves `IminCashDrawerDriver` opens the drawer through its family's module and refuses
 *          with capability `print` without the module or on a printer fault.
 * Boundary: test only; replays the recorded imin SDK fixture through a stand-in `StackraImin` Expo module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0460; ADR 0442 (decision 4); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { IminCashDrawerDriver } from "#native/drivers/imin-cash-drawer.driver";
import { POS_DEVICE_SDK } from "#native/__tests__/pos-device-sdk.fixture";

const STATUS = POS_DEVICE_SDK.status.imin;
const REFUSED = { ok: false, error: { code: "unavailable", capability: "print" } };

describe("IminCashDrawerDriver", () => {
  afterEach(POS_DEVICE_SDK.uninstall);

  it("refuses without the module", async () => {
    expect(await new IminCashDrawerDriver().open()).toEqual(REFUSED);
  });

  it("opens the drawer on a ready printer", async () => {
    const device = POS_DEVICE_SDK.install("StackraImin", STATUS.ready);
    const drawer = new IminCashDrawerDriver();
    expect(await drawer.probe()).toEqual({ ok: true, data: undefined });
    expect(await drawer.open()).toEqual({ ok: true, data: undefined });
    expect(device.openDrawer).toHaveBeenCalledTimes(1);
  });

  it("refuses on a printer fault", async () => {
    POS_DEVICE_SDK.install("StackraImin", STATUS.fault);
    expect(await new IminCashDrawerDriver().probe()).toEqual(REFUSED);
  });
});
