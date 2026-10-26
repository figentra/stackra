/**
 * Stackra file contract:
 * Purpose: unit tests of `ServiceHoldRegistryDriver`: it asks the channel with the model's name, the ids, the disposal
 *          and the links when there are any, returns the held ids as a set, asks nothing for no ids, and lets an
 *          unreachable holds service fail the disposal.
 * Boundary: test only; the channel is a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0134 (2026-10-24 amendment); STA-1241; ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Disposal } from "#contracts/enums/disposal.enum";
import type { HoldChannel } from "#contracts/ports/hold-channel.port";
import { HoldRegistry } from "#contracts/ports/hold-registry.port";
import { ServiceHoldRegistryDriver } from "#node/drivers/service-hold-registry.driver";

class Order {}

/** A driver over a channel whose `check` is `check`. */
function driverWith(check: HoldChannel["check"]) {
  const spy = vi.fn(check);
  return { driver: new ServiceHoldRegistryDriver({ check: spy } as unknown as HoldChannel), spy };
}

describe(ServiceHoldRegistryDriver, () => {
  it("is a HoldRegistry driver", () => {
    expect(driverWith(async () => []).driver).toBeInstanceOf(HoldRegistry);
  });

  it("asks the channel and returns the held ids", async () => {
    const { driver, spy } = driverWith(async () => ["ord_2"]);
    expect(await driver.heldAmong(Order, ["ord_1", "ord_2"], Disposal.Purge)).toEqual(
      new Set(["ord_2"]),
    );
    expect(spy).toHaveBeenCalledWith("Order", ["ord_1", "ord_2"], Disposal.Purge);
  });

  it("sends the subject links when there are any", async () => {
    const { driver, spy } = driverWith(async () => ["ord_1"]);
    const links = { ord_1: { customerId: "per_7" } };
    await driver.heldAmong(Order, ["ord_1"], Disposal.Edit, links);
    expect(spy).toHaveBeenCalledWith("Order", ["ord_1"], Disposal.Edit, links);
  });

  it("asks nothing for no ids, and fails when the holds service is unreachable", async () => {
    const { driver, spy } = driverWith(async () => {
      throw new Error("unreachable");
    });
    expect(await driver.heldAmong(Order, [], Disposal.Delete)).toEqual(new Set());
    expect(spy).not.toHaveBeenCalled();
    await expect(driver.heldAmong(Order, ["ord_1"], Disposal.Delete)).rejects.toThrow(
      "unreachable",
    );
  });
});
