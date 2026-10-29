/**
 * Stackra file contract:
 * Purpose: unit tests of the `SystemPermissions` port: its drivers are instances of it, and it is keyed and typed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (2026-10-29 note).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SystemPermissions } from "#contracts/ports/system-permissions.port";
import { MemorySystemPermissionsDriver } from "#core/drivers/memory-system-permissions.driver";

describe("SystemPermissions", () => {
  it("is a port its drivers are instances of", () => {
    const permissions = new MemorySystemPermissionsDriver();
    expect(permissions).toBeInstanceOf(SystemPermissions);
    expect(permissions).toBeInstanceOf(Port);
  });

  it("is keyed platform.SystemPermissions and never answers a request with prompt", () => {
    expectTypeOf<SystemPermissions["~key"]>().toEqualTypeOf<"platform.SystemPermissions">();
    expectTypeOf<SystemPermissions["request"]>().returns.toEqualTypeOf<
      Promise<"granted" | "denied" | "blocked">
    >();
  });
});
