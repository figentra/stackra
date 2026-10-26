/**
 * Stackra file contract:
 * Purpose: unit tests of `drainQueue`: it rejects before a testing app compiled; on the compiled app it runs the job
 *          an action queued with `ctx.dispatch` (through the app's own `JobDispatcher` driver and queue), runs only the
 *          named queue when one is given, and leaves a retry for its backoff.
 * Boundary: test only; a fixture module whose wiring binds the queue the way gen's wiring does, with an allowing
 *           `AccessControl`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0148 (decision 1).
 */
import { Action, ActionPipeline, type ActionContext } from "@stackra/actions";
import { AccessControl, JobDispatcher } from "@stackra/actions/contracts";
import { Driver, Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { type Actor, ActorKind, Clock, Realm } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { QueueDriver } from "#contracts/index";
import { JobOutcome, MemoryQueueDriver, QueueJobDispatcherDriver, QueueService } from "#core/index";
import { QueueWorkerService } from "#node/index";
import "#testing/index";
import { drainQueue } from "#testing/functions/drain-queue.function";

class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

class ProviderDownError extends Refusal({ kind: ErrorKind.Unavailable }) {}

class DeliverMessageAction extends Action({
  key: "message.deliver",
  actors: [ActorKind.System],
  job: { queue: "delivery", retries: 1 },
}) {
  readonly delivered: string[] = [];

  isDown = false;

  async handle(input: { messageId: string }): Promise<void> {
    if (this.isDown) throw ProviderDownError.create();
    this.delivered.push(input.messageId);
  }
}

class SendMessageAction extends Action({
  key: "message.send",
  actors: [ActorKind.User],
}) {
  async handle(input: { messageId: string }, ctx: ActionContext): Promise<void> {
    await ctx.dispatch(DeliverMessageAction, { messageId: input.messageId });
  }
}

class FixtureModule extends Module {}

registerWiring({
  member: "fixture",
  root: FixtureModule,
  bindings: [
    { module: "fixture", provide: DeliverMessageAction, deps: [] },
    { module: "fixture", provide: SendMessageAction, deps: [] },
    { module: "fixture", provide: QueueService, deps: [QueueDriver, Clock] },
    { module: "fixture", provide: QueueWorkerService, deps: [QueueDriver, Clock] },
  ],
  drivers: [
    { port: QueueDriver, candidates: { memory: async () => MemoryQueueDriver } },
    {
      port: JobDispatcher,
      candidates: { queue: async () => QueueJobDispatcherDriver },
      deps: { queue: [QueueService] },
    },
  ],
});

const user: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer };

/** The fixture app with an allowing AccessControl. */
function compile() {
  return createTestingModule(FixtureModule).override(AccessControl, new AllowAll()).compile();
}

describe(drainQueue, () => {
  it("rejects before an app compiled", async () => {
    await expect(drainQueue()).rejects.toThrow(/No testing app/);
  });

  it("runs the job an action dispatched", async () => {
    const app = await compile();
    await new ActionPipeline(app).execute(
      SendMessageAction,
      { messageId: "msg_1" },
      { actor: user },
    );
    const runs = await drainQueue();
    expect(runs.map((run) => run.outcome)).toEqual([JobOutcome.Done]);
    expect(app.get(DeliverMessageAction).delivered).toEqual(["msg_1"]);
    expect(await drainQueue()).toEqual([]);
  });

  it("runs only the named queue", async () => {
    const app = await compile();
    await app.get(QueueService).push(DeliverMessageAction, { messageId: "msg_2" });
    expect(await drainQueue("inbox")).toEqual([]);
    expect(await drainQueue("delivery")).toHaveLength(1);
  });

  it("leaves a retry for its backoff", async () => {
    const app = await compile();
    app.get(DeliverMessageAction).isDown = true;
    await app.get(QueueService).push(DeliverMessageAction, { messageId: "msg_3" });
    expect((await drainQueue()).map((run) => run.outcome)).toEqual([JobOutcome.Retried]);
    expect(await drainQueue()).toEqual([]);
  });
});
