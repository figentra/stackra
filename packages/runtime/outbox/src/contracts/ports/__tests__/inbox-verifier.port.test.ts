/**
 * Stackra file contract:
 * Purpose: unit tests of the `InboxVerifier` port: it is a `Port` whose class is its token, keyed `outbox.InboxVerifier`, and a driver
 *          subclass implements it.
 * Boundary: test only; a minimal in-test driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (drivers behind ports); ADR 0511 (amendment of 2026-11-02).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { InboxVerifier } from "#contracts/ports/inbox-verifier.port";
import type { InboxVerification } from "#contracts/types/inbox-verification.type";

/** A verifier that refuses everything. */
class NullInboxVerifier extends Driver(InboxVerifier) {
  async verify(): Promise<InboxVerification> {
    return { verified: false, reason: "unknown_key" };
  }
}

describe("InboxVerifier", () => {
  it("is a port a driver implements", async () => {
    const driver: InboxVerifier = new NullInboxVerifier();
    expect(driver).toBeInstanceOf(InboxVerifier);
    expect(driver).toBeInstanceOf(Port);
    await expect(driver.verify({}, "")).resolves.toEqual({
      verified: false,
      reason: "unknown_key",
    });
  });

  it("is keyed outbox.InboxVerifier", () => {
    expectTypeOf<InboxVerifier["~key"]>().toEqualTypeOf<"outbox.InboxVerifier">();
  });
});
