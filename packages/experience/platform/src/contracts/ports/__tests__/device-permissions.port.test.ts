/**
 * Stackra file contract:
 * Purpose: unit tests of the `DevicePermissions` port: its drivers are instances of it, and it is keyed and typed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (2026-10-29 note).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DevicePermissions } from "#contracts/ports/device-permissions.port";
import { MemoryDevicePermissionsDriver } from "#core/drivers/memory-device-permissions.driver";

describe("DevicePermissions", () => {
  it("is a port its drivers are instances of", () => {
    const permissions = new MemoryDevicePermissionsDriver();
    expect(permissions).toBeInstanceOf(DevicePermissions);
    expect(permissions).toBeInstanceOf(Port);
  });

  it("is keyed platform.DevicePermissions and never answers a request with prompt", () => {
    expectTypeOf<DevicePermissions["~key"]>().toEqualTypeOf<"platform.DevicePermissions">();
    expectTypeOf<DevicePermissions["request"]>().returns.toEqualTypeOf<
      Promise<"granted" | "denied" | "blocked">
    >();
  });
});
