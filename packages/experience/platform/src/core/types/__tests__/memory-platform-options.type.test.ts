/**
 * Stackra file contract:
 * Purpose: type tests of `MemoryPlatformOptions`: every option is optional, and the template's settings test shape
 *          (capabilities plus a permission keyed by a `PlatformCapability` code) is accepted.
 * Boundary: test only; types only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import { PlatformCapability } from "#core/enums/platform-capability.enum";
import type { MemoryPlatformOptions } from "#core/types/memory-platform-options.type";

describe("MemoryPlatformOptions", () => {
  it("takes nothing, or the template's shapes", () => {
    expectTypeOf({}).toExtend<MemoryPlatformOptions>();
    expectTypeOf({
      capabilities: [PlatformCapability.LocalNotifications],
      permissions: { [PlatformCapability.LocalNotifications]: "denied" as const },
    }).toExtend<MemoryPlatformOptions>();
    expectTypeOf({
      scanner: { isAvailable: true, permission: "granted" as const },
    }).toExtend<MemoryPlatformOptions>();
    expectTypeOf({ network: { isOnline: false } }).toExtend<MemoryPlatformOptions>();
  });
});
