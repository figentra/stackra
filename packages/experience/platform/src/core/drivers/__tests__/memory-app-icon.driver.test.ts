/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAppIconDriver`: it starts on the default icon, switches and switches back, and refuses
 *          when the device cannot change its icon.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0250 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryAppIconDriver } from "#core/drivers/memory-app-icon.driver";

describe("MemoryAppIconDriver", () => {
  it("starts on the default icon, switches and switches back", async () => {
    const appIcon = new MemoryAppIconDriver();
    expect(appIcon.current.get()).toBeNull();
    expect(await appIcon.set("Ramadan")).toEqual({ ok: true, data: undefined });
    expect(appIcon.current.get()).toBe("Ramadan");
    await appIcon.set(null);
    expect(appIcon.current.get()).toBeNull();
  });

  it("refuses on a device without alternate icons", async () => {
    const appIcon = new MemoryAppIconDriver();
    appIcon.isSupported = false;
    expect(await appIcon.set("Ramadan")).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "app_icon" },
    });
    expect(appIcon.current.get()).toBeNull();
  });
});
