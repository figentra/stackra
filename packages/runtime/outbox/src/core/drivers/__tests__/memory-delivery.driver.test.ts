/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryDeliveryDriver`: a write keeps the envelope as JSON and skips a kept (event id,
 *          subscriber, type); `due` lists live due deliveries grouped by subscriber, oldest first, up to the limit of each
 *          subscriber (so a backlog of one never starves another, 1,000 deep included); `retry` counts and moves the due
 *          time; `deadLetter` counts and hides; `remove` deletes; `list` narrows by subscriber and state; `replay` makes
 *          a dead delivery pending once and refuses a live or unknown one.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decisions 12 and 13; SC-003).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DeliveryDriver, DeliveryState } from "#contracts/index";
import { DELIVERY_NOON as NOON, deliveryOf } from "#core/__tests__/fixtures/delivery.fixture";
import { MemoryDeliveryDriver } from "#core/drivers/memory-delivery.driver";

const LATER = new Date(NOON.getTime() + 60_000);

const FAILURE = { code: "http_status", status: 503 };

describe(MemoryDeliveryDriver, () => {
  it("is a DeliveryDriver", () => {
    expect(new MemoryDeliveryDriver()).toBeInstanceOf(DeliveryDriver);
  });

  it("skips a delivery whose event, subscriber and type are kept, but keeps another version", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.write([deliveryOf()]);
    await driver.write([
      deliveryOf({ id: "dlv_2" }),
      deliveryOf({ id: "dlv_3", type: "payments.payment.captured.v0" }),
    ]);
    expect((await driver.due(NOON, 10)).map((each) => each.id)).toEqual(["dlv_1", "dlv_3"]);
  });

  it("lists each subscriber's due deliveries up to the limit, so a backlog starves no one", async () => {
    const driver = new MemoryDeliveryDriver();
    const backlog = Array.from({ length: 1000 }, (_, index) =>
      deliveryOf({
        id: `dlv_a${String(index).padStart(4, "0")}` as PublicId<"dlv">,
        eventId: `evt_${index}`,
      }),
    );
    await driver.write([
      ...backlog,
      deliveryOf({ id: "dlv_z", subscriber: "os", eventId: "evt_z" }),
    ]);
    const due = await driver.due(NOON, 100);
    expect(due.filter((each) => each.subscriber === "billing")).toHaveLength(100);
    expect(due.filter((each) => each.subscriber === "os").map((each) => each.id)).toEqual([
      "dlv_z",
    ]);
    expect(due[0]?.id).toBe("dlv_a0000");
  });

  it("counts a retry, dead-letters, removes and leaves an unknown id alone", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.write([deliveryOf(), deliveryOf({ id: "dlv_2", eventId: "evt_2" })]);
    await driver.retry("dlv_1", LATER, FAILURE);
    expect(await driver.due(NOON, 10)).toEqual([expect.objectContaining({ id: "dlv_2" })]);
    expect(await driver.due(LATER, 10)).toEqual([
      expect.objectContaining({ id: "dlv_1", attempts: 1, lastError: FAILURE }),
      expect.objectContaining({ id: "dlv_2" }),
    ]);
    await driver.deadLetter("dlv_1", FAILURE, LATER);
    await driver.remove("dlv_2");
    await driver.retry("dlv_9", LATER, FAILURE);
    expect(await driver.due(LATER, 10)).toEqual([]);
    expect(await driver.list({ limit: 10 })).toEqual([
      expect.objectContaining({ id: "dlv_1", attempts: 2, deadAt: LATER }),
    ]);
  });

  it("lists by subscriber and state, oldest first, up to the limit", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.write([
      deliveryOf(),
      deliveryOf({ id: "dlv_2", eventId: "evt_2" }),
      deliveryOf({ id: "dlv_3", eventId: "evt_3", subscriber: "os" }),
    ]);
    await driver.retry("dlv_2", LATER, FAILURE);
    await driver.deadLetter("dlv_3", FAILURE, NOON);
    const ids = async (filter: Parameters<MemoryDeliveryDriver["list"]>[0]) =>
      (await driver.list(filter)).map((each) => each.id);
    await expect(ids({ limit: 10 })).resolves.toEqual(["dlv_1", "dlv_2", "dlv_3"]);
    await expect(ids({ limit: 1 })).resolves.toEqual(["dlv_1"]);
    await expect(ids({ subscriber: "billing", limit: 10 })).resolves.toEqual(["dlv_1", "dlv_2"]);
    await expect(ids({ state: DeliveryState.Pending, limit: 10 })).resolves.toEqual(["dlv_1"]);
    await expect(ids({ state: DeliveryState.Failing, limit: 10 })).resolves.toEqual(["dlv_2"]);
    await expect(ids({ state: DeliveryState.Dead, limit: 10 })).resolves.toEqual(["dlv_3"]);
  });

  it("replays a dead delivery once and refuses a live or unknown one", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.write([deliveryOf(), deliveryOf({ id: "dlv_2", eventId: "evt_2" })]);
    await driver.deadLetter("dlv_1", FAILURE, NOON);
    await expect(driver.replay("dlv_1", LATER)).resolves.toBe(true);
    await expect(driver.replay("dlv_1", LATER)).resolves.toBe(false);
    await expect(driver.replay("dlv_2", LATER)).resolves.toBe(false);
    await expect(driver.replay("dlv_9", LATER)).resolves.toBe(false);
    const [replayed] = await driver.list({ subscriber: "billing", limit: 1 });
    expect(replayed).toMatchObject({ id: "dlv_1", attempts: 0, availableAt: LATER });
    expect(replayed?.deadAt).toBeUndefined();
  });
});
