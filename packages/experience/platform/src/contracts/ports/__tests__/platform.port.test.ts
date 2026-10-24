/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Platform` port: a port base keyed `platform.Platform`, a driver of it is an
 *          instance of it, and its facets are typed as the capability types.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0250 (decision 2); ADR 0294 (decisions 16 and 17).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Platform } from "#contracts/ports/platform.port";
import type { NetworkCapability } from "#contracts/types/network-capability.type";
import type { NotificationsCapability } from "#contracts/types/notifications-capability.type";
import type { ScannerCapability } from "#contracts/types/scanner-capability.type";
import { MemoryPlatformDriver } from "#core/drivers/memory-platform.driver";

describe("Platform", () => {
  it("is a port its drivers are instances of", () => {
    const platform = new MemoryPlatformDriver();
    expect(platform).toBeInstanceOf(Platform);
    expect(platform).toBeInstanceOf(Port);
  });

  it("is keyed platform.Platform and types its facets", () => {
    expectTypeOf<Platform["~key"]>().toEqualTypeOf<"platform.Platform">();
    expectTypeOf<Platform["network"]>().toEqualTypeOf<NetworkCapability>();
    expectTypeOf<Platform["notifications"]>().toEqualTypeOf<NotificationsCapability>();
    expectTypeOf<Platform["scanner"]>().toEqualTypeOf<ScannerCapability>();
    expectTypeOf<Platform["has"]>().toEqualTypeOf<(capability: string) => boolean>();
  });
});
