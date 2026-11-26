/**
 * Stackra file contract:
 * Purpose: unit tests of the `EventSigner` port: it is a `Port` whose class is its token, keyed `outbox.EventSigner`, and a driver
 *          subclass implements it.
 * Boundary: test only; a minimal in-test driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (drivers behind ports); ADR 0511 (amendment of 2026-11-02).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { EventSigner } from "#contracts/ports/event-signer.port";
import type { SignedHeaders } from "#contracts/types/signed-headers.type";

/** A signer that signs nothing. */
class NullEventSigner extends Driver(EventSigner) {
  async sign(id: string): Promise<SignedHeaders> {
    return { "webhook-id": id, "webhook-timestamp": "0", "webhook-signature": "" };
  }
}

describe("EventSigner", () => {
  it("is a port a driver implements", async () => {
    const driver: EventSigner = new NullEventSigner();
    expect(driver).toBeInstanceOf(EventSigner);
    expect(driver).toBeInstanceOf(Port);
    await expect(driver.sign("dlv_1", new Date(), "{}")).resolves.toMatchObject({
      "webhook-id": "dlv_1",
    });
  });

  it("is keyed outbox.EventSigner", () => {
    expectTypeOf<EventSigner["~key"]>().toEqualTypeOf<"outbox.EventSigner">();
  });
});
