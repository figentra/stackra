/**
 * Stackra file contract:
 * Purpose: unit tests of the `SystemSettings` port: its drivers are instances of it, and it is keyed and typed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (2026-10-29 note).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SystemSettings } from "#contracts/ports/system-settings.port";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import { MemorySystemSettingsDriver } from "#core/drivers/memory-system-settings.driver";

describe("SystemSettings", () => {
  it("is a port its drivers are instances of", () => {
    const settings = new MemorySystemSettingsDriver();
    expect(settings).toBeInstanceOf(SystemSettings);
    expect(settings).toBeInstanceOf(Port);
  });

  it("is keyed platform.SystemSettings and types its reads", () => {
    expectTypeOf<SystemSettings["~key"]>().toEqualTypeOf<"platform.SystemSettings">();
    expectTypeOf<SystemSettings["tracking"]>().returns.toEqualTypeOf<
      Promise<PermissionStatus | null>
    >();
    expectTypeOf<SystemSettings["lowPowerMode"]>().not.toHaveProperty("set");
  });
});
