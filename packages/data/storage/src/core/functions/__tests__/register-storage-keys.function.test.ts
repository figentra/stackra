/**
 * Stackra file contract:
 * Purpose: unit tests of `registerStorageKeys`: each class gets its key and area, registering again replaces the
 *          entry, a subclass is not covered by its parent, and an empty key is refused.
 * Boundary: test only; reads the registry back through `storageKeyOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { StorageArea } from "#core/enums/storage-area.enum";
import { registerStorageKeys } from "#core/functions/register-storage-keys.function";
import { storageKeyOf } from "#core/functions/storage-key-of.function";

class UiStore {}
class DevicePrefs {}
class CompactDevicePrefs extends DevicePrefs {}

describe("registerStorageKeys", () => {
  it("records the key and area of each class", () => {
    registerStorageKeys([
      [UiStore, { key: "console.ui", area: StorageArea.Prefs }],
      [DevicePrefs, { key: "console.device_prefs" }],
    ]);
    expect(storageKeyOf(UiStore)).toEqual({ key: "console.ui", area: "prefs" });
    expect(storageKeyOf(DevicePrefs)).toEqual({ key: "console.device_prefs" });
    expect(() => storageKeyOf(CompactDevicePrefs)).toThrow(TypeError);
  });

  it("replaces an entry registered again", () => {
    registerStorageKeys([[UiStore, { key: "console.ui", area: StorageArea.Session }]]);
    expect(storageKeyOf(UiStore).area).toBe("session");
  });

  it("refuses an empty key", () => {
    expect(() => registerStorageKeys([[UiStore, { key: "" }]])).toThrow(RangeError);
    expect(storageKeyOf(UiStore).key).toBe("console.ui");
  });
});
