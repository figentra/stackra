/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryQueueDriver`: the input stored as JSON, reservation oldest `runAt` first per queue or
 *          across queues, a held reservation that no other `reserve` returns until it lapses, unique keys held while a
 *          job waits or runs, retries that wait for their time, the dead-letter list, redrive and removal.
 * Boundary: test only; instants are fixed, so no clock runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decisions 1 and 3).
 */
import { Duration } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { JobStatus, QueueDriver } from "#contracts/index";
import type { QueuedJob } from "#contracts/index";
import { MemoryQueueDriver } from "#core/drivers/memory-queue.driver";

/** Noon on 2026-10-24 plus `seconds`. */
const at = (seconds: number) => new Date(Date.UTC(2026, 9, 24, 12, 0, seconds));

/** A waiting job due at noon, with `fields` on top. */
function jobOf(id: PublicId<"job">, fields: Partial<QueuedJob> = {}): QueuedJob {
  return {
    id,
    queue: "delivery",
    key: "messages.message.deliver@1",
    input: { messageId: "msg_1" },
    status: JobStatus.Waiting,
    attempts: 0,
    runAt: at(0),
    lease: Duration.seconds(60),
    ...fields,
  };
}

const failure = { code: "provider_unavailable", message: "provider_unavailable" };

describe(MemoryQueueDriver, () => {
  it("is a QueueDriver", () => {
    expect(new MemoryQueueDriver()).toBeInstanceOf(QueueDriver);
  });

  it("stores the input as JSON, as Postgres does", async () => {
    const driver = new MemoryQueueDriver();
    await driver.push(jobOf("job_a", { input: { sentAt: at(0) } }));
    await driver.push(jobOf("job_b", { input: undefined, runAt: at(1) }));
    expect((await driver.reserve(undefined, at(5)))?.input).toEqual({
      sentAt: "2026-10-24T12:00:00.000Z",
    });
    expect((await driver.reserve(undefined, at(5)))?.input).toBeNull();
  });

  it("reserves the oldest due job of a queue, or of any queue, marked running with one more attempt", async () => {
    const driver = new MemoryQueueDriver();
    await driver.push(jobOf("job_late", { runAt: at(20) }));
    await driver.push(jobOf("job_early", { runAt: at(10) }));
    await driver.push(jobOf("job_other", { queue: "inbox", runAt: at(0) }));
    expect(await driver.reserve("delivery", at(5))).toBeUndefined();
    const first = await driver.reserve("delivery", at(30));
    expect(first).toMatchObject({ id: "job_early", status: JobStatus.Running, attempts: 1 });
    expect((await driver.reserve(undefined, at(30)))?.id).toBe("job_other");
  });

  it("holds a reservation until its lease lapses, then hands the job out again", async () => {
    const driver = new MemoryQueueDriver();
    await driver.push(jobOf("job_a"));
    await driver.reserve(undefined, at(0));
    expect(await driver.reserve(undefined, at(59))).toBeUndefined();
    expect(await driver.reserve(undefined, at(60))).toMatchObject({ id: "job_a", attempts: 2 });
  });

  it("queues a unique job once while it waits or runs, and again once it is dead", async () => {
    const driver = new MemoryQueueDriver();
    const unique = { uniqueKey: "orders.order.expire_unpaid@1:scp_1" };
    expect(await driver.push(jobOf("job_a", unique))).toBe(true);
    expect(await driver.push(jobOf("job_b", unique))).toBe(false);
    await driver.reserve(undefined, at(0));
    expect(await driver.push(jobOf("job_c", unique))).toBe(false);
    await driver.deadLetter("job_a", failure);
    expect(await driver.push(jobOf("job_d", unique))).toBe(true);
  });

  it("makes a retried job wait for its time and keeps the failure", async () => {
    const driver = new MemoryQueueDriver();
    await driver.push(jobOf("job_a"));
    await driver.reserve(undefined, at(0));
    await driver.retry("job_a", at(30), failure);
    expect(await driver.reserve(undefined, at(29))).toBeUndefined();
    expect(await driver.reserve(undefined, at(30))).toMatchObject({
      attempts: 2,
      lastError: failure,
    });
  });

  it("lists dead letters by queue in queue order, up to the limit", async () => {
    const driver = new MemoryQueueDriver();
    for (const id of ["job_a", "job_b", "job_c"] as const) {
      await driver.push(jobOf(id, { queue: id === "job_b" ? "inbox" : "delivery" }));
      await driver.deadLetter(id, failure);
    }
    expect((await driver.deadLetters(undefined, 10)).map((job) => job.id)).toEqual([
      "job_a",
      "job_b",
      "job_c",
    ]);
    expect((await driver.deadLetters("delivery", 1)).map((job) => job.id)).toEqual(["job_a"]);
    expect((await driver.deadLetters(undefined, 10))[0]).toMatchObject({
      status: JobStatus.Dead,
      lastError: failure,
    });
  });

  it("redrives a dead job with its attempts reset, but not a live one or one whose unique key is held", async () => {
    const driver = new MemoryQueueDriver();
    await driver.push(jobOf("job_a", { uniqueKey: "u" }));
    expect(await driver.redrive("job_a", at(0))).toBe(false);
    await driver.reserve(undefined, at(0));
    await driver.deadLetter("job_a", failure);
    await driver.push(jobOf("job_b", { uniqueKey: "u" }));
    expect(await driver.redrive("job_a", at(0))).toBe(false);
    await driver.remove("job_b");
    expect(await driver.redrive("job_a", at(40))).toBe(true);
    expect(await driver.reserve(undefined, at(39))).toBeUndefined();
    expect(await driver.reserve(undefined, at(40))).toMatchObject({ id: "job_a", attempts: 1 });
  });

  it("removes a job", async () => {
    const driver = new MemoryQueueDriver();
    await driver.push(jobOf("job_a"));
    await driver.remove("job_a");
    expect(await driver.reserve(undefined, at(0))).toBeUndefined();
  });
});
