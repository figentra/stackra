/**
 * Stackra file contract:
 * Purpose: proves `listenNativeScanner` hands each recorded decoded code to the listener, drops empty, non-text and
 *          missing codes, stops on unsubscribe, and does nothing without the module.
 * Boundary: test only; replays the recorded `onScan` payloads through a stand-in Expo module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0458; ADR 0459; ADR 0460; ADR 0253 (decision 4); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { POS_DEVICE_FAMILIES } from "#native/constants/pos-device-families.constant";
import { listenNativeScanner } from "#native/functions/listen-native-scanner.function";
import { POS_DEVICE_SDK } from "#native/__tests__/pos-device-sdk.fixture";

describe("listenNativeScanner", () => {
  afterEach(POS_DEVICE_SDK.uninstall);

  it("does nothing without the module", () => {
    const listener = vi.fn();
    const stop = listenNativeScanner(POS_DEVICE_FAMILIES.sunmi, listener);
    expect(() => stop()).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  for (const family of Object.values(POS_DEVICE_FAMILIES)) {
    it(`${family.name}: hands on decoded codes and drops the rest`, () => {
      const device = POS_DEVICE_SDK.install(family.module, 0);
      const listener = vi.fn();
      const stop = listenNativeScanner(family, listener);
      expect(device.addListener).toHaveBeenCalledWith("onScan", expect.any(Function));
      for (const event of Object.values(POS_DEVICE_SDK.scan)) device.emit(event);
      expect(listener.mock.calls).toEqual([
        [POS_DEVICE_SDK.scan.ean13.code],
        [POS_DEVICE_SDK.scan.gs1.code],
      ]);
      stop();
      expect(device.remove).toHaveBeenCalledTimes(1);
    });
  }
});
