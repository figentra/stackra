/**
 * Stackra file contract:
 * Purpose: proves `openNativeDrawer` kicks the drawer only while the printer that drives it is ready, and refuses with
 *          capability `print` otherwise or when the kick rejects.
 * Boundary: test only; replays the recorded SDK fixture through a stand-in Expo module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0458; ADR 0459; ADR 0460; ADR 0253 (decision 4); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { POS_DEVICE_FAMILIES } from "#native/constants/pos-device-families.constant";
import { openNativeDrawer } from "#native/functions/open-native-drawer.function";
import { POS_DEVICE_SDK } from "#native/__tests__/pos-device-sdk.fixture";

const REFUSED = { ok: false, error: { code: "unavailable", capability: "print" } };

describe("openNativeDrawer", () => {
  afterEach(POS_DEVICE_SDK.uninstall);

  for (const family of Object.values(POS_DEVICE_FAMILIES)) {
    const recorded = POS_DEVICE_SDK.status[family.name];

    it(`${family.name}: kicks the drawer on a ready printer`, async () => {
      const device = POS_DEVICE_SDK.install(family.module, recorded.ready);
      expect(await openNativeDrawer(family)).toEqual({ ok: true, data: undefined });
      expect(device.openDrawer).toHaveBeenCalledTimes(1);
    });

    it(`${family.name}: refuses on a fault without kicking`, async () => {
      const device = POS_DEVICE_SDK.install(family.module, recorded.fault);
      expect(await openNativeDrawer(family)).toEqual(REFUSED);
      expect(device.openDrawer).not.toHaveBeenCalled();
    });

    it(`${family.name}: refuses when the kick rejects`, async () => {
      const device = POS_DEVICE_SDK.install(family.module, recorded.ready);
      device.openDrawer.mockRejectedValueOnce(new Error("drawer port"));
      expect(await openNativeDrawer(family)).toEqual(REFUSED);
    });
  }
});
