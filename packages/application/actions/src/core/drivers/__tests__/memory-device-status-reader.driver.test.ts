/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryDeviceStatusReaderDriver`: an unknown device is not revoked, a revoked one is, and
 *          revoking one device leaves the others alone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0338; ADR 0361 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { DeviceStatusReader } from "#contracts/index";
import { MemoryDeviceStatusReaderDriver } from "#core/drivers/memory-device-status-reader.driver";

describe("MemoryDeviceStatusReaderDriver", () => {
  it("is a DeviceStatusReader", () => {
    expect(new MemoryDeviceStatusReaderDriver()).toBeInstanceOf(DeviceStatusReader);
  });

  it("reports only the revoked devices", async () => {
    const reader = new MemoryDeviceStatusReaderDriver();
    expect(await reader.isRevoked("dev_1")).toBe(false);
    reader.revoke("dev_1");
    expect(await reader.isRevoked("dev_1")).toBe(true);
    expect(await reader.isRevoked("dev_2")).toBe(false);
  });
});
