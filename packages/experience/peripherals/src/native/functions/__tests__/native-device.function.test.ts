/**
 * Stackra file contract:
 * Purpose: proves `nativeDevice` finds a family's module in the Expo modules registry, and answers `undefined` with
 *          no registry or with another family's module only.
 * Boundary: test only; the registry is a stand-in on `globalThis.expo`, removed after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0442 (decision 4); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { POS_DEVICE_FAMILIES } from "#native/constants/pos-device-families.constant";
import { nativeDevice } from "#native/functions/native-device.function";
import { POS_DEVICE_SDK } from "#native/__tests__/pos-device-sdk.fixture";

describe("nativeDevice", () => {
  afterEach(POS_DEVICE_SDK.uninstall);

  it("answers undefined without the registry", () => {
    expect(nativeDevice(POS_DEVICE_FAMILIES.sunmi)).toBeUndefined();
  });

  it("finds only the family's own module", () => {
    const device = POS_DEVICE_SDK.install("StackraPax", 0);
    expect(nativeDevice(POS_DEVICE_FAMILIES.pax)).toBe(device);
    expect(nativeDevice(POS_DEVICE_FAMILIES.sunmi)).toBeUndefined();
    expect(nativeDevice(POS_DEVICE_FAMILIES.imin)).toBeUndefined();
  });
});
