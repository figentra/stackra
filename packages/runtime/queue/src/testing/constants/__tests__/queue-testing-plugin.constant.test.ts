/**
 * Stackra file contract:
 * Purpose: unit tests of `QUEUE_TESTING_PLUGIN`: it is the `@stackra/queue` plugin, it adds no member to the app, and
 *          on an app that binds no queue it gives the helpers a memory queue and a worker connected to that app.
 * Boundary: test only; a fixture module that binds one job action and nothing of the queue. The case of an app that
 *           binds its own queue is `drainQueue`'s test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0263 (decision 12).
 */
import { Action } from "@stackra/actions";
import { AccessControl } from "@stackra/actions/contracts";
import { Driver, Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { JobOutcome } from "#core/index";
import { QUEUE_TESTING_PLUGIN } from "#testing/constants/queue-testing-plugin.constant";
import { runJob } from "#testing/functions/run-job.function";

class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

class PurgeEntriesAction extends Action({
  key: "entry.purge",
  actors: [ActorKind.System],
  job: { queue: "maintenance" },
}) {
  async handle(_input: object): Promise<{ deleted: number }> {
    return { deleted: 3 };
  }
}

class BareModule extends Module {}

registerWiring({
  member: "bare",
  root: BareModule,
  bindings: [{ module: "bare", provide: PurgeEntriesAction, deps: [] }],
});

describe("QUEUE_TESTING_PLUGIN", () => {
  it("is the queue's plugin and adds no app member", () => {
    expect(QUEUE_TESTING_PLUGIN.name).toBe("@stackra/queue");
    expect(QUEUE_TESTING_PLUGIN.builder).toBeUndefined();
  });

  it("gives an app without a queue a memory queue and a connected worker", async () => {
    await createTestingModule(BareModule).override(AccessControl, new AllowAll()).compile();
    const job = await runJob(PurgeEntriesAction, {});
    expect(job).toMatchObject({ outcome: JobOutcome.Done, output: { deleted: 3 } });
  });
});
