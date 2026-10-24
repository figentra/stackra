/**
 * Stackra file contract:
 * Purpose: unit tests of `QueueJobDispatcherDriver`: it is the `JobDispatcher` behind `ctx.dispatch`, and it stores the
 *          job on the action's queue on behalf of the calling actor, caused by the call.
 * Boundary: test only; a real `QueueService` over the memory driver and a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rule 28); ADR 0136 (decision 3).
 */
import { Action } from "@stackra/actions";
import { JobDispatcher } from "@stackra/actions/contracts";
import type { CallDescriptor } from "@stackra/actions/contracts";
import { type Actor, ActorKind, ApiArea, Clock, Realm } from "@stackra/contracts";
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
  });
});
