/**
 * Stackra file contract:
 * Purpose: unit tests of `BrokerQueueDriver`: a push publishes the job to `queue.<queue>`; a delivered job is claimed
 *          running with one more attempt, or refused `job_not_due` before its `runAt`; a retry publishes it again with a
 *          new message id; a finished job is forgotten; a dead letter lands in `queue.jobs` without its unique key;
 *          dead letters and redrive go through the store; nothing is reserved.
 * Boundary: test only; the memory broker publisher stands in for the generated topics and the Postgres store's methods
 *           are spied, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decisions 1 and 3).
 */
import { Duration } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { JobStatus, QueueDriver } from "#contracts/index";
import type { QueuedJob } from "#contracts/index";
import { MemoryBrokerPublisherDriver } from "#core/drivers/memory-broker-publisher.driver";
import { JobNotDueError } from "#core/errors/job-not-due.error";
import { BrokerQueueDriver } from "#node/drivers/broker-queue.driver";
import { PostgresQueueDriver } from "#node/drivers/postgres-queue.driver";

const NOON = new Date(Date.UTC(2026, 9, 27, 12));

const job: QueuedJob = {
  id: "job_a",
  queue: "delivery",
  key: "messages.message.deliver@1",
  input: { messageId: "msg_1" },
  uniqueKey: "messages.message.deliver@1:scp_1",
  status: JobStatus.Waiting,
  attempts: 0,
  runAt: NOON,
  lease: Duration.minutes(6),
};

/** A broker driver over the memory publisher, with the Postgres store spied. */
function setup() {
  const broker = new MemoryBrokerPublisherDriver();
  const store = {
    push: vi.spyOn(PostgresQueueDriver.prototype, "push").mockResolvedValue(true),
    deadLetter: vi.spyOn(PostgresQueueDriver.prototype, "deadLetter").mockResolvedValue(),
    remove: vi.spyOn(PostgresQueueDriver.prototype, "remove").mockResolvedValue(),
    deadLetters: vi
      .spyOn(PostgresQueueDriver.prototype, "deadLetters")
      .mockResolvedValue([{ ...job, status: JobStatus.Dead, attempts: 4 }]),
  };
  const driver = new BrokerQueueDriver(broker, {} as Database);
  return { broker, store, driver };
}

describe(BrokerQueueDriver, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("publishes a pushed job to its queue's topic and reserves nothing", async () => {
    const { broker, driver } = setup();
    expect(driver).toBeInstanceOf(QueueDriver);
    await expect(driver.push(job)).resolves.toBe(true);
    expect(broker.published.get("queue.delivery")).toEqual([
      // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
      { id: "job_a", body: JSON.parse(JSON.stringify(job)) },
    ]);
    await expect(driver.reserve("delivery", NOON)).resolves.toBeUndefined();
  });

  it("claims a due job running with one more attempt and refuses one not due", async () => {
    const { driver } = setup();
    await expect(driver.claim(job, NOON)).resolves.toMatchObject({
      status: JobStatus.Running,
      attempts: 1,
    });
    const early = await driver.claim(job, new Date(NOON.getTime() - 1)).catch((error) => error);
    expect(isRefusal(early, JobNotDueError)).toBe(true);
  });

  it("publishes a retry again under a message id with its attempt", async () => {
    const { broker, driver } = setup();
    await driver.claim(job, NOON);
    const later = new Date(NOON.getTime() + 60_000);
    await driver.retry("job_a", later, { code: "internal", message: "boom" });
    const [message] = broker.published.get("queue.delivery") ?? [];
    expect(message?.id).toBe("job_a:1");
    expect(message?.body).toMatchObject({
      status: JobStatus.Waiting,
      attempts: 1,
      runAt: later.toISOString(),
      lastError: { code: "internal", message: "boom" },
    });
    await expect(driver.retry("job_a", later, { code: "x", message: "y" })).rejects.toThrow(
      TypeError,
    );
  });

  it("forgets a finished job and deletes one it does not run from the store", async () => {
    const { store, driver } = setup();
    await driver.claim(job, NOON);
    await driver.remove("job_a");
    expect(store.remove).not.toHaveBeenCalled();
    await driver.remove("job_a");
    expect(store.remove).toHaveBeenCalledWith("job_a");
  });

  it("keeps a dead letter in the store without its unique key", async () => {
    const { store, driver } = setup();
    await driver.claim(job, NOON);
    await driver.deadLetter("job_a", { code: "internal", message: "boom" });
    expect(store.push.mock.calls[0]?.[0]).not.toHaveProperty("uniqueKey");
    expect(store.deadLetter).toHaveBeenCalledWith("job_a", { code: "internal", message: "boom" });
    await expect(driver.deadLetters("delivery", 10)).resolves.toHaveLength(1);
  });

  it("redrives a dead letter onto the broker with its attempts reset", async () => {
    const { broker, store, driver } = setup();
    await expect(driver.redrive("job_a", NOON)).resolves.toBe(true);
    expect(broker.published.get("queue.delivery")?.[0]?.body).toMatchObject({
      status: JobStatus.Waiting,
      attempts: 0,
    });
    expect(store.remove).toHaveBeenCalledWith("job_a");
    await expect(driver.redrive("job_b", NOON)).resolves.toBe(false);
  });
});
