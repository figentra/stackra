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

/** A store that keeps nothing. */
class NullDeliveryDriver extends Driver(DeliveryDriver) {
  async write(): Promise<void> {}

  async due(): Promise<readonly Delivery[]> {
    return [];
  }

  async remove(): Promise<void> {}

  async retry(): Promise<void> {}

  async deadLetter(): Promise<void> {}

  async list(): Promise<readonly Delivery[]> {
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
    await expect(driver.due(new Date(), 10)).resolves.toEqual([]);
    await expect(driver.replay("dlv_1", new Date())).resolves.toBe(false);
  });

  it("is keyed outbox.DeliveryDriver", () => {
    expectTypeOf<DeliveryDriver["~key"]>().toEqualTypeOf<"outbox.DeliveryDriver">();
  });
});
