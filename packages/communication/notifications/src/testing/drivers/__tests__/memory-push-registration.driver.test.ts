/**
 * Stackra file contract:
 * Purpose: proves `MemoryPushRegistrationDriver` is a `PushRegistration`, answers granted by default and records the
 *          registration once per idempotency key, and answers a set refusal without registering.
 * Boundary: unit tier; the driver alone.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0263; ADR 0138.
 */
import { describe, expect, it } from "@stackra/testing";

import { PushRegistration } from "#contracts/ports/push-registration.port";
import { MemoryPushRegistrationDriver } from "#testing/drivers/memory-push-registration.driver";

describe("MemoryPushRegistrationDriver", () => {
  it("is a PushRegistration that grants and registers once per key", async () => {
    const registration = new MemoryPushRegistrationDriver();
    expect(registration).toBeInstanceOf(PushRegistration);
    const input = { trigger: "onboarding", idempotencyKey: "k1" };
    expect(await registration.register(input)).toBe("granted");
    expect(await registration.register(input)).toBe("granted");
    expect(registration.registrations).toEqual([input]);
  });

  it("answers a refusal without registering", async () => {
    const registration = new MemoryPushRegistrationDriver().answers("denied");
    expect(await registration.register({ trigger: "settings" })).toBe("denied");
    expect(registration.registrations).toEqual([]);
  });
});
