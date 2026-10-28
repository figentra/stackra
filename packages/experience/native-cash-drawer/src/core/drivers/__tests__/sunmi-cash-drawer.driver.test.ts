/**
 * Stackra file contract:
 * Purpose: proves `SunmiCashDrawerDriver` opens the drawer through the module after a ready printer status, and refuses
 *          with capability `print`, without a pulse, without the module, out of paper, on a fault, or when the module
 *          rejects.
 * Boundary: test only; replays the recorded sunmi SDK fixture through a stand-in `StackraCashDrawer` Expo module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 5); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { CASH_DRAWER_SDK } from "#core/__tests__/cash-drawer-sdk.fixture";
import { SunmiCashDrawerDriver } from "#core/drivers/sunmi-cash-drawer.driver";

const STATUS = CASH_DRAWER_SDK.status.sunmi;
const REFUSED = { ok: false, error: { code: "unavailable", capability: "print" } };

describe("SunmiCashDrawerDriver", () => {
  afterEach(CASH_DRAWER_SDK.uninstall);

  it("refuses without the module", async () => {
    const drawer = new SunmiCashDrawerDriver();
    expect(await drawer.probe()).toEqual(REFUSED);
    expect(await drawer.open()).toEqual(REFUSED);
  });

  it("opens the drawer on a ready printer", async () => {
    const module = CASH_DRAWER_SDK.install(STATUS.ready);
    const drawer = new SunmiCashDrawerDriver();
    expect(await drawer.probe()).toEqual({ ok: true, data: undefined });
    expect(await drawer.open()).toEqual({ ok: true, data: undefined });
    expect(module.status).toHaveBeenCalledWith("sunmi");
    expect(module.open).toHaveBeenCalledWith("sunmi");
    expect(module.open).toHaveBeenCalledTimes(1);
  });

  it("refuses without a pulse out of paper and on a fault", async () => {
    for (const status of [STATUS.outOfPaper, STATUS.fault]) {
      const module = CASH_DRAWER_SDK.install(status);
      expect(await new SunmiCashDrawerDriver().open()).toEqual(REFUSED);
      expect(module.open).not.toHaveBeenCalled();
    }
  });

  it("refuses when the module rejects", async () => {
    const module = CASH_DRAWER_SDK.install(STATUS.ready);
    module.open.mockRejectedValueOnce(new Error("no drawer port"));
    expect(await new SunmiCashDrawerDriver().open()).toEqual(REFUSED);
    module.status.mockRejectedValueOnce(new Error("service unbound"));
    expect(await new SunmiCashDrawerDriver().probe()).toEqual(REFUSED);
  });
});
