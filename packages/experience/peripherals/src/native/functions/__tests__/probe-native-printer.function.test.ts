/**
 * Stackra file contract:
 * Purpose: proves `probeNativePrinter` answers ready on each family's recorded ready status and refuses with
 *          capability `print` on its recorded out-of-paper, overheated and fault statuses, without the module, and
 *          when the status call rejects.
 * Boundary: test only; replays the recorded SDK fixture through a stand-in Expo module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0458; ADR 0459; ADR 0460; ADR 0250 (decision 3); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { POS_DEVICE_FAMILIES } from "#native/constants/pos-device-families.constant";
import { probeNativePrinter } from "#native/functions/probe-native-printer.function";
import { POS_DEVICE_SDK } from "#native/__tests__/pos-device-sdk.fixture";

const REFUSED = { ok: false, error: { code: "unavailable", capability: "print" } };

describe("probeNativePrinter", () => {
  afterEach(POS_DEVICE_SDK.uninstall);

  for (const family of Object.values(POS_DEVICE_FAMILIES)) {
    const recorded = POS_DEVICE_SDK.status[family.name];

    it(`${family.name}: refuses without the module`, async () => {
      expect(await probeNativePrinter(family)).toEqual(REFUSED);
    });

    it(`${family.name}: answers ready on the recorded ready status`, async () => {
      POS_DEVICE_SDK.install(family.module, recorded.ready);
      expect(await probeNativePrinter(family)).toEqual({ ok: true, data: undefined });
    });

    it(`${family.name}: refuses on every recorded not-ready status`, async () => {
      for (const status of [recorded.outOfPaper, recorded.overheated, recorded.fault]) {
        POS_DEVICE_SDK.install(family.module, status);
        expect(await probeNativePrinter(family)).toEqual(REFUSED);
      }
    });

    it(`${family.name}: refuses when the status call rejects`, async () => {
      const device = POS_DEVICE_SDK.install(family.module, recorded.ready);
      device.printerStatus.mockRejectedValueOnce(new Error("service not bound"));
      expect(await probeNativePrinter(family)).toEqual(REFUSED);
    });
  }
});
