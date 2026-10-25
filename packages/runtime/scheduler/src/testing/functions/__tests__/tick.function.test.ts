/**
 * Stackra file contract:
 * Purpose: unit tests of `tick`: it rejects without a current scheduler, and on a compiled app that binds the
 *          scheduler it pushes the due cron run into the app's queue, which `drainQueue` then runs.
 * Boundary: test only; a fixture module whose wiring binds the queue, locks and scheduler the way gen's wiring does,
 *           with an allowing `AccessControl`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0148 (decisions 4 and 5).
 */
import { Action } from "@stackra/actions";
import { AccessControl } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { Driver, Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { ActorKind, Clock, Logger } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { LockDriver } from "@stackra/locking/contracts";
import { MemoryQueueDriver, QueueService } from "@stackra/queue";
import { QueueDriver } from "@stackra/queue/contracts";
import { QueueWorkerService } from "@stackra/queue/node";
import { drainQueue } from "@stackra/queue/testing";
import { describe, expect, it } from "@stackra/testing";

import { SchedulerConfig } from "#config/scheduler.config";
import { CronScopes, ScheduleDriver } from "#contracts/index";
import {
  MemoryCronScopesDriver,
  MemoryScheduleDriver,
  registerScheduledJobs,
  SchedulerService,
} from "#core/index";
import "#testing/index";
import { CURRENT_SCHEDULER } from "#testing/constants/current-scheduler.constant";
import { tick } from "#testing/functions/tick.function";

class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

class SilentLogger extends Driver(Logger) {
  debug(): void {}

  info(): void {}

  warn(): void {}

  error(): void {}
}

class PurgeEntriesAction extends Action({
  key: "entry.purge",
  actors: [ActorKind.System],
  job: { queue: "maintenance", cron: { schedule: "30 3 * * *" } },
}) {
  runs = 0;

  async handle(_input: object): Promise<void> {
    this.runs += 1;
  }
}

registerScheduledJobs([{ type: PurgeEntriesAction, key: "access_log.entry.purge@1" }]);

class FixtureModule extends Module {}

registerWiring({
  member: "fixture",
  root: FixtureModule,
  bindings: [
    { module: "fixture", provide: PurgeEntriesAction, deps: [] },
    { module: "fixture", provide: QueueService, deps: [QueueDriver, Clock] },
    { module: "fixture", provide: QueueWorkerService, deps: [QueueDriver, Clock] },
    { module: "fixture", provide: Locks, deps: [LockDriver, Clock] },
    {
      module: "fixture",
      provide: SchedulerService,
      deps: [QueueService, Locks, ScheduleDriver, CronScopes, Clock, SchedulerConfig, Logger],
    },
  ],
  drivers: [
    { port: QueueDriver, candidates: { memory: async () => MemoryQueueDriver } },
    {
      port: LockDriver,
      candidates: { memory: async () => MemoryLockDriver },
      deps: { memory: [Clock] },
    },
    { port: ScheduleDriver, candidates: { memory: async () => MemoryScheduleDriver } },
    { port: CronScopes, candidates: { memory: async () => MemoryCronScopesDriver } },
    { port: Logger, candidates: { silent: async () => SilentLogger } },
  ],
});

describe(tick, () => {
  it("rejects without a current scheduler", async () => {
    CURRENT_SCHEDULER.value = undefined;
    await expect(tick()).rejects.toThrow(/No scheduler/);
  });

  it("pushes the due cron run into the app's queue, which drainQueue runs", async () => {
    const app = await createTestingModule(FixtureModule)
      .override(AccessControl, new AllowAll())
      .override(SchedulerConfig, buildConfig(SchedulerConfig))
      .compile();
    const result = await tick(new Date("2026-10-24T03:30:20Z"));
    expect(result).toEqual({ ran: true, pushed: 1, skipped: [] });
    await drainQueue("maintenance");
    expect(app.get(PurgeEntriesAction).runs).toBe(1);
  });
});
