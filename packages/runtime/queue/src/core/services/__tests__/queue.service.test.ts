/**
 * Stackra file contract:
 * Purpose: unit tests of `QueueService`: `push` stores one waiting run with the action's queue, the caller, the scope,
 *          the Idempotency-Key and a lease of the timeout plus a grace minute; a unique job is queued once per scope
 *          (the scope's id, else the caller's, else platform-wide); a queued call of an action without a `job` option
 *          needs its caller; `deadLetters` and `redrive` reach the driver's dead letters.
 * Boundary: test only; the memory driver and a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decision 1); ADR 0260 (decision 4); ADR 0327 (`ScopeRef`).
 */
import { Action } from "@stackra/actions";
import { type Actor, ActorKind, Clock, Duration, Realm, type ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { JobStatus } from "#contracts/index";
import { MemoryQueueDriver } from "#core/drivers/memory-queue.driver";
import { QueueService } from "#core/services/queue.service";

const NOON = new Date(Date.UTC(2026, 9, 24, 12));

class FixedClock extends Clock {
  now(): Date {
    return new Date(NOON);
  }
}

class ExpireUnpaidOrdersAction extends Action({
  key: "order.expire_unpaid",
  actors: [ActorKind.System],
  job: { queue: "maintenance", unique: true, timeout: "2m", retries: 3 },
}) {
  async handle(_input: { batchSize: number }): Promise<void> {}
}

class VoidPaymentAction extends Action({
  key: "payment.void",
  actors: [ActorKind.Service],
}) {
  async handle(_input: { paymentId: string }): Promise<void> {}
}

const scope: ScopeRef = { id: "scp_1", path: "platform.acme" };

const caller: Actor = { kind: ActorKind.Service, id: "svc_commerce", scopeId: "org_1" };

const user: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer };

/** A service over a fresh memory driver. */
function setup() {
  const driver = new MemoryQueueDriver();
  return { driver, queue: new QueueService(driver, new FixedClock()) };
}

describe(QueueService, () => {
  it("stores one waiting run of the action, due now", async () => {
    const { driver, queue } = setup();
    const id = await queue.push(
      ExpireUnpaidOrdersAction,
      { batchSize: 100 },
      { scope, origin: caller, idempotencyKey: "k1", causedBy: "call-1" },
    );
    expect(id).toMatch(/^job_/);
    expect(await driver.reserve("maintenance", NOON)).toEqual({
      id,
      queue: "maintenance",
      key: "order.expire_unpaid",
      input: { batchSize: 100 },
      origin: caller,
      scope,
      idempotencyKey: "k1",
      uniqueKey: "order.expire_unpaid:scp_1",
      causedBy: "call-1",
      status: JobStatus.Running,
      attempts: 1,
      runAt: NOON,
      lease: Duration.minutes(3),
    });
  });

  it("queues a unique job once per scope", async () => {
    const { queue } = setup();
    expect(await queue.push(ExpireUnpaidOrdersAction, { batchSize: 1 }, { scope })).toMatch(
      /^job_/,
    );
    expect(await queue.push(ExpireUnpaidOrdersAction, { batchSize: 1 }, { scope })).toBeUndefined();
    const other = { id: "scp_2", path: "platform.globex" } as const;
    expect(await queue.push(ExpireUnpaidOrdersAction, { batchSize: 1 }, { scope: other })).toMatch(
      /^job_/,
    );
  });

  it("keys a unique job without a scope by the caller's, else platform-wide", async () => {
    const { driver, queue } = setup();
    await queue.push(ExpireUnpaidOrdersAction, { batchSize: 1 }, { origin: caller });
    await queue.push(ExpireUnpaidOrdersAction, { batchSize: 1 });
    const keys = [
      (await driver.reserve(undefined, NOON))?.uniqueKey,
      (await driver.reserve(undefined, NOON))?.uniqueKey,
    ];
    expect(keys.sort()).toEqual(["order.expire_unpaid:-", "order.expire_unpaid:org_1"]);
  });

  it("queues a call of an action without a job option on the default queue, only with its caller", async () => {
    const { driver, queue } = setup();
    await expect(queue.push(VoidPaymentAction, { paymentId: "pay_1" })).rejects.toThrow(TypeError);
    await queue.push(VoidPaymentAction, { paymentId: "pay_1" }, { origin: user });
    expect(await driver.reserve("default", NOON)).toMatchObject({
      key: "payment.void",
      origin: user,
      lease: Duration.minutes(6),
    });
  });

  it("lists and redrives dead letters", async () => {
    const { driver, queue } = setup();
    const id = await queue.push(ExpireUnpaidOrdersAction, { batchSize: 1 }, { scope });
    if (id === undefined) throw new Error("not queued");
    await driver.reserve(undefined, NOON);
    await driver.deadLetter(id, { code: "internal", message: "boom" });
    expect((await queue.deadLetters("maintenance")).map((job) => job.id)).toEqual([id]);
    expect(await queue.deadLetters("delivery")).toEqual([]);
    expect(await queue.redrive(id)).toBe(true);
    expect(await queue.deadLetters()).toEqual([]);
    expect(await driver.reserve(undefined, NOON)).toMatchObject({ id, attempts: 1 });
  });
});
