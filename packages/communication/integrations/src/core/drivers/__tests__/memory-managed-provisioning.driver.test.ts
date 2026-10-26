/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryManagedProvisioningDriver`: a create is idempotent by its reference and waits pending,
 *          settle, suspend and remove move the status with the time, cost events are read per resource from a date and
 *          recorded once, and an unknown resource is not found.
 * Boundary: test only; a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; R3-SO-03.
 */
import { Clock } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { ProvisioningStatus } from "#contracts/enums/provisioning-status.enum";
import { MemoryManagedProvisioningDriver } from "#core/drivers/memory-managed-provisioning.driver";

/** A clock the test moves. */
class MovableClock extends Clock {
  at = new Date("2026-10-26T09:00:00Z");

  now(): Date {
    return this.at;
  }
}

const REQUEST = {
  reference: "prov_1",
  category: "messaging",
  provider: "twilio",
  scope: { id: "scp_00000000000000000000000001", path: "acme" },
  details: { brand: "Acme" },
} as const;

describe("MemoryManagedProvisioningDriver", () => {
  it("creates once per reference and waits for the provider's answer", async () => {
    const provisioning = new MemoryManagedProvisioningDriver(new MovableClock());
    const created = await provisioning.create(REQUEST);
    expect(created).toMatchObject({ status: "pending", category: "messaging", provider: "twilio" });
    expect(await provisioning.create(REQUEST)).toBe(created);
    expect(await provisioning.verify(created.id)).toBe(created);
  });

  it("moves the status and stamps the time", async () => {
    const clock = new MovableClock();
    const provisioning = new MemoryManagedProvisioningDriver(clock);
    const { id } = await provisioning.create(REQUEST);
    clock.at = new Date("2026-10-27T09:00:00Z");
    expect(
      await provisioning.settle(id, ProvisioningStatus.Failed, "brand_rejected"),
    ).toMatchObject({ status: "failed", reason: "brand_rejected", updatedAt: clock.at });
    expect(await provisioning.suspend(id)).not.toHaveProperty("reason");
    expect((await provisioning.remove(id)).status).toBe("removed");
    expect((await provisioning.status(id))?.status).toBe("removed");
    expect(await provisioning.status("res_none")).toBeNull();
    await expect(provisioning.verify("res_none")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("reads a resource's cost events from a date, each once", async () => {
    const provisioning = new MemoryManagedProvisioningDriver(new MovableClock());
    const { id } = await provisioning.create(REQUEST);
    const event = {
      id: "cost_1",
      resourceId: id,
      category: "messaging",
      provider: "twilio",
      meter: "brand_registration",
      quantity: 1,
      cost: Money.ofMinor(400, "USD"),
      occurredAt: new Date("2026-10-26T10:00:00Z"),
    };
    await provisioning.record(event);
    await provisioning.record(event);
    expect(await provisioning.costs(id, new Date("2026-10-26T00:00:00Z"))).toEqual([event]);
    expect(await provisioning.costs(id, new Date("2026-10-27T00:00:00Z"))).toEqual([]);
    await expect(provisioning.record({ ...event, resourceId: "res_none" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
