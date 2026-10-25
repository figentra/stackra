/**
 * Stackra file contract:
 * Purpose: unit tests of `runJob`: it rejects before a testing app compiled; it runs a job to `done` with the output;
 *          it runs every attempt of a poison job without waiting for the backoff, dead-letters it after its retries
 *          and calls `onDeadLetter` once (the template's `toDeadLetter({ attempts: 6 })` shape); and it rejects when a
 *          unique job of the same scope already waits.
 * Boundary: test only; a fixture module whose wiring binds the queue the way gen's wiring does, with an allowing
 *           `AccessControl`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0148 (decision 1).
 */
import { Action } from "@stackra/actions";
import { AccessControl } from "@stackra/actions/contracts";
import { Driver, Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { ActorKind, Clock } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { QueueDriver } from "#contracts/index";
import { Backoff, JobOutcome, MemoryQueueDriver, QueueService } from "#core/index";
import { QueueWorkerService } from "#node/index";
import "#testing/index";
import { runJob } from "#testing/functions/run-job.function";

class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

class ProviderUnavailableError extends Refusal({ kind: ErrorKind.Unavailable }) {}

class DeliverMessageAction extends Action({
  key: "message.deliver",
  actors: [ActorKind.System],
  job: {
    queue: "delivery",
    retries: 5,
    backoff: Backoff.Exponential,
    deadLetter: true,
    onDeadLetter: "markFailed",
  },
}) {
  isDown = false;

  readonly failed: string[] = [];

  async handle(input: { messageId: string }): Promise<{ messageId: string }> {
    if (this.isDown) throw ProviderUnavailableError.create();
    return { messageId: input.messageId };
  }

  async markFailed(input: { messageId: string }): Promise<void> {
    this.failed.push(input.messageId);
  }
}

class ExpireUnpaidOrdersAction extends Action({
  key: "order.expire_unpaid",
  actors: [ActorKind.System],
  job: { queue: "maintenance", unique: true },
}) {
  async handle(_input: { batchSize: number }): Promise<void> {}
}

class FixtureModule extends Module {}

registerWiring({
  member: "fixture",
  root: FixtureModule,
  bindings: [
    { module: "fixture", provide: DeliverMessageAction, deps: [] },
    { module: "fixture", provide: ExpireUnpaidOrdersAction, deps: [] },
    { module: "fixture", provide: QueueService, deps: [QueueDriver, Clock] },
    { module: "fixture", provide: QueueWorkerService, deps: [QueueDriver, Clock] },
  ],
  drivers: [{ port: QueueDriver, candidates: { memory: async () => MemoryQueueDriver } }],
});

/** The fixture app with an allowing AccessControl. */
function compile() {
  return createTestingModule(FixtureModule).override(AccessControl, new AllowAll()).compile();
}

describe(runJob, () => {
  it("rejects before an app compiled", async () => {
    await expect(runJob(DeliverMessageAction, { messageId: "msg_1" })).rejects.toThrow(
      /No testing app/,
    );
  });

  it("runs a job to done with its output", async () => {
    await compile();
    const job = await runJob(DeliverMessageAction, { messageId: "msg_1" });
    expect(job).toMatchObject({
      outcome: JobOutcome.Done,
      attempts: 1,
      output: { messageId: "msg_1" },
    });
    expect(job.id).toMatch(/^job_/);
    expect(job).not.toDeadLetter();
  });

  it("dead-letters a poison job after every attempt and calls onDeadLetter once", async () => {
    const app = await compile();
    app.get(DeliverMessageAction).isDown = true;
    const job = await runJob(DeliverMessageAction, { messageId: "msg_2" });
    expect(job).toDeadLetter({ attempts: 6 });
    expect(job.runs.map((run) => run.outcome)).toEqual([
      ...Array.from({ length: 5 }, () => JobOutcome.Retried),
      JobOutcome.DeadLettered,
    ]);
    expect(app.get(DeliverMessageAction).failed).toEqual(["msg_2"]);
    expect(await app.get(QueueService).deadLetters("delivery")).toHaveLength(1);
  });

  it("rejects when a unique job of the same scope already waits", async () => {
    const app = await compile();
    await app.get(QueueService).push(ExpireUnpaidOrdersAction, { batchSize: 100 });
    await expect(runJob(ExpireUnpaidOrdersAction, { batchSize: 100 })).rejects.toThrow(
      /already waits or runs/,
    );
  });
});
