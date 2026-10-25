/**
 * Stackra file contract:
 * Purpose: unit tests of `QueueJobDispatcherDriver`: it is the `JobDispatcher` behind `ctx.dispatch`, and it stores the
 *          job on the action's queue on behalf of the calling actor, in the call's scope, caused by the call; a call
 *          with no scope queues a platform job.
 * Boundary: test only; a real `QueueService` over the memory driver and a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rule 28); ADR 0136 (decision 3); ADR 0327 (decision 6).
 */
import { Action } from "@stackra/actions";
import { JobDispatcher } from "@stackra/actions/contracts";
import type { CallDescriptor } from "@stackra/actions/contracts";
import { type Actor, ActorKind, ApiArea, Clock, Realm, type ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MemoryQueueDriver } from "#core/drivers/memory-queue.driver";
import { QueueJobDispatcherDriver } from "#core/drivers/queue-job-dispatcher.driver";
import { QueueService } from "#core/services/queue.service";

const NOON = new Date(Date.UTC(2026, 9, 24, 12));

class FixedClock extends Clock {
  now(): Date {
    return new Date(NOON.getTime());
  }
}

class DeliverMessageAction extends Action({
  key: "message.deliver",
  actors: [ActorKind.System],
  job: { queue: "delivery", retries: 5, deadLetter: true },
}) {
  async handle(_input: { messageId: string }): Promise<void> {}
}

class SendMessageAction extends Action({ key: "message.send", actors: [ActorKind.Service] }) {
  async handle(): Promise<void> {}
}

const caller: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer };

const call: CallDescriptor = {
  callId: "call-1",
  type: SendMessageAction,
  kind: "action",
  key: "message.send",
  actor: caller,
  area: ApiArea.App,
};

describe(QueueJobDispatcherDriver, () => {
  it("is the JobDispatcher behind ctx.dispatch", () => {
    const driver = new MemoryQueueDriver();
    expect(new QueueJobDispatcherDriver(new QueueService(driver, new FixedClock()))).toBeInstanceOf(
      JobDispatcher,
    );
  });

  it("stores the job on its queue, for the caller, caused by the call", async () => {
    const driver = new MemoryQueueDriver();
    const dispatcher = new QueueJobDispatcherDriver(new QueueService(driver, new FixedClock()));
    await dispatcher.dispatch(DeliverMessageAction, { messageId: "msg_1" }, call);
    expect(await driver.reserve("delivery", NOON)).toMatchObject({
      key: "message.deliver",
      input: { messageId: "msg_1" },
      origin: caller,
      causedBy: "call-1",
      runAt: NOON,
    });
    await dispatcher.dispatch(DeliverMessageAction, { messageId: "msg_2" }, call);
    expect(await driver.reserve("delivery", NOON)).not.toHaveProperty("scope");
  });

  it("queues the job in the call's scope, so the worker opens that scope session", async () => {
    const driver = new MemoryQueueDriver();
    const dispatcher = new QueueJobDispatcherDriver(new QueueService(driver, new FixedClock()));
    const scope: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
    await dispatcher.dispatch(DeliverMessageAction, { messageId: "msg_1" }, { ...call, scope });
    expect((await driver.reserve("delivery", NOON))?.scope).toEqual(scope);
  });
});
