/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `KioskMode` port: keyed `platform.KioskMode`, its memory driver an instance.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0281; ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { KioskMode } from "#contracts/ports/kiosk-mode.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import { MemoryKioskModeDriver } from "#core/drivers/memory-kiosk-mode.driver";

describe("KioskMode", () => {
  it("is a port its drivers are instances of", () => {
    const kiosk = new MemoryKioskModeDriver();
    expect(kiosk).toBeInstanceOf(KioskMode);
    expect(kiosk).toBeInstanceOf(Port);
  });

  it("is keyed platform.KioskMode and types its calls", () => {
    expectTypeOf<KioskMode["~key"]>().toEqualTypeOf<"platform.KioskMode">();
    expectTypeOf<KioskMode["enter"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
    expectTypeOf<KioskMode["isActive"]>().returns.toEqualTypeOf<Promise<boolean>>();
  });
});
