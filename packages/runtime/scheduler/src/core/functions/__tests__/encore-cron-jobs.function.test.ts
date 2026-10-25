/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreCronJobs`: one CronJob per registered action with a `cron` (its kebab id, its key as
 *          title, its schedule), none for a job action without one, and the minute tick of the stored schedules last.
 * Boundary: test only; registers its own actions under keys no other test uses.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decisions 4 and 6).
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { encoreCronJobs } from "#core/functions/encore-cron-jobs.function";
import { registerScheduledJobs } from "#core/functions/register-scheduled-jobs.function";

class NightlyPurgeAction extends Action({
  key: "entry.nightly_purge",
  actors: [ActorKind.System],
  job: { queue: "maintenance", cron: { schedule: "30 3 * * *" } },
}) {
  async handle(_input: object): Promise<void> {}
}

class OnDemandAction extends Action({
  key: "report.build",
  actors: [ActorKind.System],
  job: { queue: "default" },
}) {
  async handle(_input: object): Promise<void> {}
}

registerScheduledJobs([
  { type: NightlyPurgeAction, key: "encore_test.entry.nightly_purge@1" },
  { type: OnDemandAction, key: "encore_test.report.build@1" },
]);

describe("encoreCronJobs", () => {
  it("declares one CronJob per cron action and the schedules' minute tick", () => {
    const jobs = encoreCronJobs();
    expect(jobs).toContainEqual({
      name: "encore-test-entry-nightly-purge-1",
      title: "encore_test.entry.nightly_purge@1",
      schedule: "30 3 * * *",
      key: "encore_test.entry.nightly_purge@1",
    });
    expect(jobs.some((job) => job.key === "encore_test.report.build@1")).toBe(false);
    expect(jobs.at(-1)).toEqual({
      name: "scheduler-schedules",
      title: "Stored per-scope schedules",
      schedule: "* * * * *",
    });
    for (const job of jobs) expect(job.name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});
