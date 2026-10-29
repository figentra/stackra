/**
 * Stackra file contract:
 * Purpose: unit tests of the `AppIcon` port: its drivers are instances of it, and it is keyed and typed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (decision 2).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AppIcon } from "#contracts/ports/app-icon.port";
import { MemoryAppIconDriver } from "#core/drivers/memory-app-icon.driver";

describe("AppIcon", () => {
  it("is a port its drivers are instances of", () => {
    const appIcon = new MemoryAppIconDriver();
    expect(appIcon).toBeInstanceOf(AppIcon);
    expect(appIcon).toBeInstanceOf(Port);
  });

  it("is keyed platform.AppIcon and reads null for the default icon", () => {
    expectTypeOf<AppIcon["~key"]>().toEqualTypeOf<"platform.AppIcon">();
    expectTypeOf<ReturnType<AppIcon["current"]["get"]>>().toEqualTypeOf<string | null>();
  });
});
