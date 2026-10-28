/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySystemSettingsDriver`: no controls by default, a test sets each value, the tracking
 *          prompt answers only an undecided permission, and opening the settings is counted.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0250 (2026-10-29 note).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemorySystemSettingsDriver } from "#core/drivers/memory-system-settings.driver";

describe("MemorySystemSettingsDriver", () => {
  it("has no controls by default", async () => {
    const settings = new MemorySystemSettingsDriver();
    expect(await settings.tracking()).toBeNull();
    expect(await settings.requestTracking()).toBeNull();
    expect(await settings.backgroundRefresh()).toBeNull();
    expect(settings.lowPowerMode.get()).toBe(false);
    expect(settings.expensiveNetwork.get()).toBe(false);
  });

  it("answers an undecided tracking prompt once", async () => {
    const settings = new MemorySystemSettingsDriver();
    settings.trackingStatus = "prompt";
    settings.requestAnswer = "granted";
    expect(await settings.requestTracking()).toBe("granted");
    settings.requestAnswer = "denied";
    expect(await settings.requestTracking()).toBe("granted");
  });

  it("tells subscribers when power saving changes and counts settings opens", async () => {
    const settings = new MemorySystemSettingsDriver();
    const seen: boolean[] = [];
    settings.lowPowerMode.subscribe((on) => seen.push(on));
    settings.lowPowerMode.set(true);
    await settings.openSettings();
    expect(seen).toEqual([true]);
    expect(settings.settingsOpened).toBe(1);
  });
});
