/**
 * Stackra file contract:
 * Purpose: unit tests of the `SubscriberSource` port: it is a `Port` whose class is its token, keyed `outbox.SubscriberSource`, and a driver
 *          subclass implements it.
 * Boundary: test only; a minimal in-test driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (drivers behind ports); ADR 0511 (amendment of 2026-11-02).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SubscriberSource } from "#contracts/ports/subscriber-source.port";
import type { Subscriber } from "#contracts/types/subscriber.type";

/** A source with no subscribers. */
class NullSubscriberSource extends Driver(SubscriberSource) {
  async subscribersOf(): Promise<readonly Subscriber[]> {
    return [];
  }
}

describe("SubscriberSource", () => {
  it("is a port a driver implements", async () => {
    const driver: SubscriberSource = new NullSubscriberSource();
    expect(driver).toBeInstanceOf(SubscriberSource);
    expect(driver).toBeInstanceOf(Port);
    await expect(driver.subscribersOf("a.b.v1")).resolves.toEqual([]);
  });

  it("is keyed outbox.SubscriberSource", () => {
    expectTypeOf<SubscriberSource["~key"]>().toEqualTypeOf<"outbox.SubscriberSource">();
  });
});
