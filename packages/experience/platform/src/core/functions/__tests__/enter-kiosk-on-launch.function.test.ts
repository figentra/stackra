/**
 * Stackra file contract:
 * Purpose: unit tests of `enterKioskOnLaunch`: nothing happens unless the device setting or the config asks; the
 *          device setting wins over the config both ways; a target that cannot lock answers its refusal; a lock
 *          already on is left alone.
 * Boundary: test only; the memory kiosk driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0428 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryKioskModeDriver } from "#core/drivers/memory-kiosk-mode.driver";
import { enterKioskOnLaunch } from "#core/functions/enter-kiosk-on-launch.function";

describe("enterKioskOnLaunch", () => {
  it("does nothing when neither the device nor the config asks", async () => {
    const kiosk = new MemoryKioskModeDriver();
    expect(await enterKioskOnLaunch(kiosk, { enterOnLaunch: false })).toBeUndefined();
    expect(kiosk.active).toBe(false);
  });

  it("enters when the config asks, unless the device setting says no", async () => {
    const kiosk = new MemoryKioskModeDriver();
    expect(await enterKioskOnLaunch(kiosk, { enterOnLaunch: true }, false)).toBeUndefined();
    expect(kiosk.active).toBe(false);
    expect(await enterKioskOnLaunch(kiosk, { enterOnLaunch: true })).toEqual({
      ok: true,
      data: undefined,
    });
    expect(kiosk.active).toBe(true);
  });

  it("enters when the device setting asks over the config", async () => {
    const kiosk = new MemoryKioskModeDriver();
    await enterKioskOnLaunch(kiosk, { enterOnLaunch: false }, true);
    expect(kiosk.active).toBe(true);
  });

  it("answers the refusal of a target that cannot lock", async () => {
    const kiosk = new MemoryKioskModeDriver();
    kiosk.isSupported = false;
    const result = await enterKioskOnLaunch(kiosk, { enterOnLaunch: true });
    expect(result?.ok).toBe(false);
    expect(kiosk.active).toBe(false);
  });
});
