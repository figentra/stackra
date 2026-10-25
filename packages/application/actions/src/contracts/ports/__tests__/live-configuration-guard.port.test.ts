/**
 * Stackra file contract:
 * Purpose: unit tests of the `LiveConfigurationGuard` port: a port a driver extends, refusing a structural write in
 *          live with `live_read_only`.
 * Boundary: test only; a stand-in driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decision 3).
 */
import { Driver } from "@stackra/container";
import { LiveReadOnlyError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LiveConfigurationGuard } from "#contracts/ports/live-configuration-guard.port";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

class AlwaysLive extends Driver(LiveConfigurationGuard) {
  async check(): Promise<void> {
    throw LiveReadOnlyError.create();
  }
}

describe("LiveConfigurationGuard", () => {
  it("is a port that refuses live structural writes", async () => {
    const guard = new AlwaysLive();
    expect(guard).toBeInstanceOf(LiveConfigurationGuard);
    await expect(guard.check({} as CallDescriptor)).rejects.toMatchObject({
      code: "live_read_only",
    });
  });
});
