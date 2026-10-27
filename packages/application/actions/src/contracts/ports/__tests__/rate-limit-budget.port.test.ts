/**
 * Stackra file contract:
 * Purpose: unit tests of the `RateLimitBudget` port: it is an abstract `Port` (its own token, never built directly)
 *          and a driver answers a bucket per call, or `undefined` to keep the configured one.
 * Boundary: test only; the driver here is a stand-in for the entitlements package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0217 (decision 2).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RateLimitBudget } from "#contracts/ports/rate-limit-budget.port";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import type { RateLimitBucket } from "#contracts/types/rate-limit-bucket.type";

class PlanDriver extends Driver(RateLimitBudget) {
  async areaBucket(call: CallDescriptor): Promise<RateLimitBucket | undefined> {
    return call.scopeId === undefined ? undefined : { capacity: 5, tokensPerSecond: 5 / 60 };
  }
}

describe("RateLimitBudget", () => {
  it("is an abstract port", () => {
    expect(RateLimitBudget.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver = new PlanDriver();
    const call = { scopeId: "ten_1" } as unknown as CallDescriptor;
    expect(await driver.areaBucket(call)).toEqual({ capacity: 5, tokensPerSecond: 5 / 60 });
    expect(await driver.areaBucket({} as CallDescriptor)).toBeUndefined();
  });
});
