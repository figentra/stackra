/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryDevicePermissionsDriver`: everything starts unasked, a request answers an askable
 *          permission, a granted or blocked one stays, and opening the settings is counted.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0250 (2026-10-29 note).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryDevicePermissionsDriver } from "#core/drivers/memory-device-permissions.driver";

describe("MemoryDevicePermissionsDriver", () => {
  it("starts every permission unasked and answers a request", async () => {
    const permissions = new MemoryDevicePermissionsDriver();
    expect(await permissions.status("camera")).toBe("prompt");
    permissions.requestAnswer = "denied";
    expect(await permissions.request("camera")).toBe("denied");
    permissions.requestAnswer = "granted";
    expect(await permissions.request("camera")).toBe("granted");
    expect(await permissions.status("camera")).toBe("granted");
  });

  it("keeps a blocked permission blocked and counts settings opens", async () => {
    const permissions = new MemoryDevicePermissionsDriver();
    permissions.statuses.bluetooth = "blocked";
    expect(await permissions.request("bluetooth")).toBe("blocked");
    await permissions.openSettings();
    expect(permissions.settingsOpened).toBe(1);
  });
});
