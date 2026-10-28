/**
 * Stackra file contract:
 * Purpose: unit tests of `CAPABILITY_FACETS`: every facet of the `Platform` port maps to a capability code, and no
 *          requirement level stands for a facet.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CAPABILITY_FACETS } from "#core/constants/capability-facets.constant";
import { MemoryPlatformDriver } from "#core/drivers/memory-platform.driver";
import { PlatformCapability } from "#core/enums/platform-capability.enum";

describe("CAPABILITY_FACETS", () => {
  it("covers every facet of the port with a capability code", () => {
    const platform = new MemoryPlatformDriver();
    for (const [facet, capability] of Object.entries(CAPABILITY_FACETS)) {
      expect(platform).toHaveProperty(facet);
      expect(Enum.values(PlatformCapability)).toContain(capability);
      expect([PlatformCapability.Required, PlatformCapability.Optional]).not.toContain(capability);
    }
    expect(CAPABILITY_FACETS.notifications).toBe("local_notifications");
  });
});
