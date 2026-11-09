/**
 * Stackra file contract:
 * Purpose: unit tests of the `DeliveryDriver` port: it is a `Port` whose class is its token, keyed `outbox.DeliveryDriver`, and a driver
 *          subclass implements it.
 * Boundary: test only; a minimal in-test driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (drivers behind ports); ADR 0511 (amendment of 2026-11-02).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DeliveryDriver } from "#contracts/ports/delivery-driver.port";
import type { Delivery } from "#contracts/types/delivery.type";
import type { DeliveryClaim } from "#contracts/types/delivery-claim.type";

/** A store that keeps nothing. */
class NullDeliveryDriver extends Driver(DeliveryDriver) {
  async write(): Promise<void> {}

  async lease(): Promise<readonly DeliveryClaim[]> {
    return [];
  }

  async load(): Promise<Delivery | undefined> {
    return undefined;
  }

  async remove(): Promise<void> {}

  async retry(): Promise<void> {}

  async deadLetter(): Promise<void> {}

  async list(): Promise<readonly DeliveryClaim[]> {
    return [];
  }

  async replay(): Promise<boolean> {
    return false;
  }
}

describe("DeliveryDriver", () => {
  it("is a port a driver implements", async () => {
    const driver: DeliveryDriver = new NullDeliveryDriver();
    expect(driver).toBeInstanceOf(DeliveryDriver);
    expect(driver).toBeInstanceOf(Port);
    await expect(driver.lease(new Date(), 10, new Date())).resolves.toEqual([]);
    await expect(driver.replay("dlv_1", new Date())).resolves.toBe(false);
    await expect(driver.load("dlv_1")).resolves.toBeUndefined();
  });

  it("is keyed outbox.DeliveryDriver", () => {
    expectTypeOf<DeliveryDriver["~key"]>().toEqualTypeOf<"outbox.DeliveryDriver">();
  });

  it("claims ids, owners, subscribers and states, never an envelope", () => {
    expectTypeOf<keyof DeliveryClaim>().toEqualTypeOf<"id" | "ownerId" | "subscriber" | "state">();
  });
});
