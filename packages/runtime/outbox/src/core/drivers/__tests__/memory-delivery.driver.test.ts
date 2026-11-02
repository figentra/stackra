/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryDeliveryDriver`: a write keeps the envelope as JSON and skips a delivery whose event
 *          id, subscriber and wire name are already stored; `due` lists live deliveries due at `now`, fairly across
 *          subscribers, up to the limit; `retry` counts the attempt and moves the due time; `deadLetter` counts it and
 *          hides the delivery from `due`; `list` filters by state and subscriber; `replay` revives only a dead
 *          delivery; `remove` deletes; `pruneDead` deletes only deliveries dead before its cutoff.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decisions 12 and 13); ADR 0078 (decision 4).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DeliveryDriver } from "#contracts/index";
import type { Delivery } from "#contracts/index";
import { MemoryDeliveryDriver } from "#core/drivers/memory-delivery.driver";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const LATER = new Date(NOON.getTime() + 60_000);

const FAILURE = { code: "http_503", message: "consumer down" };

/** A delivery of event `event` to `subscriber`, written `age` seconds after noon and due at `NOON`. */
function delivery(
  id: PublicId<"dlv">,
  subscriber: string,
  event: string,
  age = 0,
  type = "payments.payment.captured.v1",
): Delivery {
  return {
    id,
    subscriber,
    envelope: {
      id: event,
      type,
      occurredAt: NOON.toISOString(),
      envelopeVersion: 1,
      meta: {},
      data: { amount: 5 },
    },
    attempts: 0,
    availableAt: NOON,
    createdAt: new Date(NOON.getTime() + age * 1000),
  };
}

/** The ids of `deliveries`. */
function idsOf(deliveries: readonly Delivery[]): readonly string[] {
  return deliveries.map((one) => one.id);
}

describe(MemoryDeliveryDriver, () => {
  it("is a DeliveryDriver", () => {
    expect(new MemoryDeliveryDriver()).toBeInstanceOf(DeliveryDriver);
  });

  it("keeps the envelope as JSON, as Postgres does", async () => {
    const driver = new MemoryDeliveryDriver();
    const one = delivery("dlv_A", "shop", "evt_1");
    await driver.write([
      { ...one, envelope: { ...one.envelope, data: { at: NOON, gone: undefined } } },
    ]);
    const [stored] = await driver.due(NOON, 10);
    expect(stored?.envelope.data).toEqual({ at: NOON.toISOString() });
  });

  // @covers sta-1910:FR-003
  it("skips a delivery already stored for the same event, subscriber and wire name", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.write([delivery("dlv_A", "shop", "evt_1")]);
    await driver.write([
      delivery("dlv_B", "shop", "evt_1"),
      delivery("dlv_C", "billing", "evt_1"),
      delivery("dlv_D", "shop", "evt_1", 0, "payments.payment.captured.v2"),
      delivery("dlv_E", "shop", "evt_1"),
    ]);
    expect(idsOf(driver.stored())).toEqual(["dlv_A", "dlv_C", "dlv_D"]);
  });

  it("lists only live deliveries due at now, up to the limit", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.write([
      delivery("dlv_A", "shop", "evt_1"),
      { ...delivery("dlv_B", "shop", "evt_2", 1), availableAt: LATER },
      delivery("dlv_C", "shop", "evt_3", 2),
    ]);
    await driver.deadLetter("dlv_C", FAILURE, NOON);
    expect(idsOf(await driver.due(NOON, 10))).toEqual(["dlv_A"]);
    expect(idsOf(await driver.due(LATER, 10))).toEqual(["dlv_A", "dlv_B"]);
    expect(await driver.due(LATER, 1)).toHaveLength(1);
  });

  // @covers sta-1910:FR-003
  // @covers sta-1910:SC-003
  it("takes each subscriber's first before any subscriber's second, so a backlog crowds out no one", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.write([
      delivery("dlv_A1", "shop", "evt_1", 0),
      delivery("dlv_A2", "shop", "evt_2", 1),
      delivery("dlv_A3", "shop", "evt_3", 2),
      delivery("dlv_A4", "shop", "evt_4", 3),
      delivery("dlv_B1", "billing", "evt_5", 4),
      delivery("dlv_C1", "mail", "evt_6", 5),
    ]);
    expect(idsOf(await driver.due(NOON, 3))).toEqual(["dlv_A1", "dlv_B1", "dlv_C1"]);
    expect(idsOf(await driver.due(NOON, 10))).toEqual([
      "dlv_A1",
      "dlv_B1",
      "dlv_C1",
      "dlv_A2",
      "dlv_A3",
      "dlv_A4",
    ]);
  });

  it("counts a retry and moves the due time, leaving the delivery live", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.write([delivery("dlv_A", "shop", "evt_1")]);
    await driver.retry("dlv_A", LATER, FAILURE);
    expect(await driver.due(NOON, 10)).toEqual([]);
    const [retried] = await driver.due(LATER, 10);
    expect(retried).toMatchObject({ attempts: 1, availableAt: LATER, lastError: FAILURE });
  });

  it("ignores a retry or a dead letter of a delivery no longer kept", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.retry("dlv_X", LATER, FAILURE);
    await driver.deadLetter("dlv_X", FAILURE, LATER);
    expect(driver.stored()).toEqual([]);
  });

  it("removes a delivery, which may then be written again", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.write([delivery("dlv_A", "shop", "evt_1")]);
    await driver.remove("dlv_A");
    expect(driver.stored()).toEqual([]);
    await driver.write([delivery("dlv_B", "shop", "evt_1")]);
    expect(idsOf(driver.stored())).toEqual(["dlv_B"]);
  });

  // @covers sta-1910:FR-014
  it("lists pending, failing and dead deliveries, per subscriber, oldest first", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.write([
      delivery("dlv_A", "shop", "evt_1", 0),
      delivery("dlv_B", "shop", "evt_2", 1),
      delivery("dlv_C", "billing", "evt_3", 2),
      delivery("dlv_D", "shop", "evt_4", 3),
      delivery("dlv_E", "billing", "evt_5", 4),
    ]);
    await driver.retry("dlv_B", LATER, FAILURE);
    await driver.retry("dlv_C", LATER, FAILURE);
    await driver.deadLetter("dlv_D", FAILURE, LATER);
    await driver.deadLetter("dlv_E", FAILURE, LATER);
    expect(idsOf(await driver.list({ state: "pending" }))).toEqual(["dlv_A"]);
    expect(idsOf(await driver.list({ state: "failing" }))).toEqual(["dlv_B", "dlv_C"]);
    expect(idsOf(await driver.list({ state: "failing", subscriber: "shop" }))).toEqual(["dlv_B"]);
    expect(idsOf(await driver.list({ state: "dead" }))).toEqual(["dlv_D", "dlv_E"]);
    expect(idsOf(await driver.list({ state: "dead", subscriber: "billing" }))).toEqual(["dlv_E"]);
  });

  // @covers sta-1910:FR-014
  // @covers sta-1910:SC-003
  it("replays a dead delivery with no attempts and no failure, and only a dead one", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.write([delivery("dlv_A", "shop", "evt_1"), delivery("dlv_B", "shop", "evt_2", 1)]);
    await driver.deadLetter("dlv_A", FAILURE, NOON);
    expect(await driver.replay("dlv_A", LATER)).toBe(true);
    expect(await driver.replay("dlv_B", LATER)).toBe(false);
    expect(await driver.replay("dlv_X", LATER)).toBe(false);
    const [replayed] = await driver.list({ state: "pending", subscriber: "shop" });
    expect(replayed).toMatchObject({ id: "dlv_A", attempts: 0, availableAt: LATER });
    expect(replayed?.deadAt).toBeUndefined();
    expect(replayed?.lastError).toBeUndefined();
    expect(await driver.replay("dlv_A", LATER)).toBe(false);
  });

  it("prunes only deliveries dead before the cutoff", async () => {
    const driver = new MemoryDeliveryDriver();
    await driver.write([
      delivery("dlv_A", "shop", "evt_1"),
      delivery("dlv_B", "shop", "evt_2", 1),
      delivery("dlv_C", "shop", "evt_3", 2),
    ]);
    await driver.deadLetter("dlv_A", FAILURE, NOON);
    await driver.deadLetter("dlv_B", FAILURE, LATER);
    expect(await driver.pruneDead(LATER)).toBe(1);
    expect(idsOf(driver.stored())).toEqual(["dlv_B", "dlv_C"]);
  });
});
