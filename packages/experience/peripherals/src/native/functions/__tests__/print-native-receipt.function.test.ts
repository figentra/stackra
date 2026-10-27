/**
 * Stackra file contract:
 * Purpose: proves `printNativeReceipt` prints only on a ready printer, hands the lines over as text with control
 *          characters dropped and Arabic kept, names the family and order back, and refuses with capability `print`
 *          when the printer is not ready or the print call rejects.
 * Boundary: test only; replays the recorded SDK fixture through a stand-in Expo module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0458; ADR 0459; ADR 0460; ADR 0253 (decision 4); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { POS_DEVICE_FAMILIES } from "#native/constants/pos-device-families.constant";
import { printNativeReceipt } from "#native/functions/print-native-receipt.function";
import { POS_DEVICE_SDK } from "#native/__tests__/pos-device-sdk.fixture";

const REFUSED = { ok: false, error: { code: "unavailable", capability: "print" } };
const RECEIPT = { orderId: "ord_1", lines: ["Latte\u001bp\u0000 18.00", "الإجمالي 18.00"] };

describe("printNativeReceipt", () => {
  afterEach(POS_DEVICE_SDK.uninstall);

  for (const family of Object.values(POS_DEVICE_FAMILIES)) {
    const recorded = POS_DEVICE_SDK.status[family.name];

    it(`${family.name}: prints the lines as text`, async () => {
      const device = POS_DEVICE_SDK.install(family.module, recorded.ready);
      expect(await printNativeReceipt(family, RECEIPT)).toEqual({
        ok: true,
        data: { printer: family.name, orderId: "ord_1" },
      });
      expect(device.printLines).toHaveBeenCalledWith(["Lattep 18.00", "الإجمالي 18.00"]);
    });

    it(`${family.name}: refuses out of paper without printing`, async () => {
      const device = POS_DEVICE_SDK.install(family.module, recorded.outOfPaper);
      expect(await printNativeReceipt(family, RECEIPT)).toEqual(REFUSED);
      expect(device.printLines).not.toHaveBeenCalled();
    });

    it(`${family.name}: refuses when the print call rejects`, async () => {
      const device = POS_DEVICE_SDK.install(family.module, recorded.ready);
      device.printLines.mockRejectedValueOnce(new Error("paper jam"));
      expect(await printNativeReceipt(family, RECEIPT)).toEqual(REFUSED);
    });
  }
});
