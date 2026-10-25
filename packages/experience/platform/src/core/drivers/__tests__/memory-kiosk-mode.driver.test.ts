/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryKioskModeDriver`: it enters and exits, and refuses on `window` when unsupported.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0281.
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryKioskModeDriver } from "#core/drivers/memory-kiosk-mode.driver";

describe("MemoryKioskModeDriver", () => {
  it("enters and exits", async () => {
    const kiosk = new MemoryKioskModeDriver();
    expect(await kiosk.probe()).toEqual({ ok: true, data: undefined });
    await kiosk.enter();
    expect(await kiosk.isActive()).toBe(true);
    await kiosk.exit();
    expect(await kiosk.isActive()).toBe(false);
  });

  it("refuses when unsupported", async () => {
    const kiosk = new MemoryKioskModeDriver();
    kiosk.isSupported = false;
    const refused = { ok: false, error: { code: "unavailable", capability: "window" } };
    expect(await kiosk.probe()).toEqual(refused);
    expect(await kiosk.enter()).toEqual(refused);
    expect(await kiosk.exit()).toEqual(refused);
    expect(await kiosk.isActive()).toBe(false);
  });
});
