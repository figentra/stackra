/**
 * Stackra file contract:
 * Purpose: proves `PaxCashDrawerDriver` opens the drawer through its family's module and refuses
 *          with capability `print` without the module or on a printer fault.
 * Boundary: test only; replays the recorded pax SDK fixture through a stand-in `StackraPax` Expo module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0459; ADR 0442 (decision 4); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { PaxCashDrawerDriver } from "#native/drivers/pax-cash-drawer.driver";
import { POS_DEVICE_SDK } from "#native/__tests__/pos-device-sdk.fixture";

const STATUS = POS_DEVICE_SDK.status.pax;
const REFUSED = { ok: false, error: { code: "unavailable", capability: "print" } };

describe("PaxCashDrawerDriver", () => {
  afterEach(POS_DEVICE_SDK.uninstall);

  it("refuses without the module", async () => {
    expect(await new PaxCashDrawerDriver().open()).toEqual(REFUSED);
  });

  it("opens the drawer on a ready printer", async () => {
    const device = POS_DEVICE_SDK.install("StackraPax", STATUS.ready);
    const drawer = new PaxCashDrawerDriver();
    expect(await drawer.probe()).toEqual({ ok: true, data: undefined });
    expect(await drawer.open()).toEqual({ ok: true, data: undefined });
    expect(device.openDrawer).toHaveBeenCalledTimes(1);
  });

  it("refuses on a printer fault", async () => {
    POS_DEVICE_SDK.install("StackraPax", STATUS.fault);
    expect(await new PaxCashDrawerDriver().probe()).toEqual(REFUSED);
  });
});
