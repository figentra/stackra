/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryOutboxDriver`: a write keeps the payload as JSON; `due` lists messages due at `now` that
 *          are not dead, oldest first and by id within one instant, up to the limit; `retry` counts the attempt and
 *          moves the due time; `deadLetter` counts it and hides the message from `due`; `remove` deletes it;
 *          `pruneDead` deletes only messages dead before its cutoff; `holding` finds live and dead messages by a value
 *          at any depth of their payload; `rewrite` replaces a payload and keeps the delivery state.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decision 4).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MessageKind, OutboxDriver } from "#contracts/index";
import type { OutboxMessage } from "#contracts/index";
import { MemoryOutboxDriver } from "#core/drivers/memory-outbox.driver";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const LATER = new Date(NOON.getTime() + 60_000);

/** A message due at `at`. */
function message(id: PublicId<"evt">, at: Date = NOON): OutboxMessage {
  return {
    id,
    kind: MessageKind.Event,
    type: "orders.order.paid.v1",
    data: { orderId: "ord_1", paidAt: at },
    meta: {},
    occurredAt: at,
    attempts: 0,
    availableAt: at,
  };
}

const FAILURE = { code: "internal", message: "transport down" };

describe(MemoryOutboxDriver, () => {
  it("is an OutboxDriver", () => {
    expect(new MemoryOutboxDriver()).toBeInstanceOf(OutboxDriver);
  });

  it("keeps the payload as JSON, as Postgres does", async () => {
    const driver = new MemoryOutboxDriver();
    await driver.write([message("evt_A")]);
    const [stored] = await driver.due(NOON, 10);
    expect(stored?.data).toEqual({ orderId: "ord_1", paidAt: NOON.toISOString() });
  });

  it("lists due messages oldest first, by id within one instant, up to the limit", async () => {
    const driver = new MemoryOutboxDriver();
    await driver.write([message("evt_C", LATER), message("evt_B"), message("evt_A")]);
    expect((await driver.due(NOON, 10)).map((each) => each.id)).toEqual(["evt_A", "evt_B"]);
    expect((await driver.due(LATER, 2)).map((each) => each.id)).toEqual(["evt_A", "evt_B"]);
    expect((await driver.due(LATER, 10)).map((each) => each.id)).toEqual([
      "evt_A",
      "evt_B",
      "evt_C",
    ]);
  });

  it("counts a retry and makes the message due again later", async () => {
    const driver = new MemoryOutboxDriver();
    await driver.write([message("evt_A")]);
    await driver.retry("evt_A", LATER, FAILURE);
    expect(await driver.due(NOON, 10)).toEqual([]);
    const [retried] = await driver.due(LATER, 10);
    expect(retried).toMatchObject({ attempts: 1, availableAt: LATER, lastError: FAILURE });
  });

  it("counts the last attempt and keeps a dead message out of due", async () => {
    const driver = new MemoryOutboxDriver();
    await driver.write([message("evt_A")]);
    await driver.deadLetter("evt_A", FAILURE, NOON);
    expect(await driver.due(LATER, 10)).toEqual([]);
    expect(driver.stored()).toEqual([
      expect.objectContaining({ id: "evt_A", attempts: 1, deadAt: NOON, lastError: FAILURE }),
    ]);
  });

  it("removes a delivered message and leaves an unknown id alone", async () => {
    const driver = new MemoryOutboxDriver();
    await driver.write([message("evt_A")]);
    await driver.remove("evt_A");
    await driver.retry("evt_A", LATER, FAILURE);
    expect(driver.stored()).toEqual([]);
  });

  it("prunes only messages dead before the cutoff", async () => {
    const driver = new MemoryOutboxDriver();
    await driver.write([message("evt_A"), message("evt_B"), message("evt_C")]);
    await driver.deadLetter("evt_A", FAILURE, NOON);
    await driver.deadLetter("evt_B", FAILURE, LATER);
    await expect(driver.pruneDead(LATER)).resolves.toBe(1);
    expect(driver.stored().map((stored) => stored.id)).toEqual(["evt_B", "evt_C"]);
  });

  it("finds live and dead messages holding a value at any depth, never by a key", async () => {
    const driver = new MemoryOutboxDriver();
    await driver.write([
      { ...message("evt_A"), data: { order: { lines: [{ customerId: "usr_1" }] } } },
      { ...message("evt_B"), data: { usr_1: true } },
      { ...message("evt_C"), data: { customerId: "usr_1" } },
    ]);
    await driver.deadLetter("evt_C", FAILURE, NOON);
    expect((await driver.holding("usr_1")).map((held) => held.id)).toEqual(["evt_A", "evt_C"]);
  });

  it("rewrites a payload, keeping the delivery state, and ignores an unknown id", async () => {
    const driver = new MemoryOutboxDriver();
    await driver.write([message("evt_A")]);
    await driver.retry("evt_A", LATER, FAILURE);
    await driver.rewrite("evt_A", { orderId: "ord_1", email: null });
    await driver.rewrite("evt_Z", {});
    const [stored] = driver.stored();
    expect(stored?.data).toEqual({ orderId: "ord_1", email: null });
    expect(stored?.attempts).toBe(1);
    expect(stored?.availableAt).toEqual(LATER);
    expect(driver.stored()).toHaveLength(1);
  });
});
