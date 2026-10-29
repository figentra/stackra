/**
 * Stackra file contract:
 * Purpose: unit tests of the `AppLock` port: its drivers are instances of it, and it is keyed and typed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (2026-10-29 note).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AppLock } from "#contracts/ports/app-lock.port";
import { MemoryAppLockDriver } from "#core/drivers/memory-app-lock.driver";

describe("AppLock", () => {
  it("is a port its drivers are instances of", () => {
    const lock = new MemoryAppLockDriver();
    expect(lock).toBeInstanceOf(AppLock);
    expect(lock).toBeInstanceOf(Port);
  });

  it("is keyed platform.AppLock", () => {
    expectTypeOf<AppLock["~key"]>().toEqualTypeOf<"platform.AppLock">();
    expectTypeOf<AppLock["authenticate"]>().returns.toEqualTypeOf<Promise<boolean>>();
  });
});
