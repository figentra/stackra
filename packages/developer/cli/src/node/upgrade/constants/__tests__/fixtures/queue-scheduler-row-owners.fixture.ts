/**
 * Stackra file contract:
 * Purpose: the `queue-scheduler-row-owners` codemod fixture (0.30.0): a custom QueueDriver without `load` and a
 *          custom ScheduleDriver without `claim` are reported, drivers already ported are not, and a file that does
 *          not import from the queue or the scheduler is not read.
 * Boundary: test fixture only; the sources are strings, never compiled.
 * Runtime: node (vitest)
 * Governing contract: ADR 0199 (Enforcement); STA-145; changeset 98a8940.
 */
import type { CodemodFixture } from "#node/upgrade/constants/__tests__/fixtures/codemod-fixture.type";

const queue = `import { QueueDriver } from "@stackra/queue/contracts";

export class SqsQueueDriver extends QueueDriver {
  async reserve() {}
}
`;

const schedule = `import { ScheduleDriver } from "@stackra/scheduler";

export class CronScheduleDriver extends ScheduleDriver {
  async schedules() {}
}
`;

const ported = `import { QueueDriver } from "@stackra/queue/contracts";
import { ScheduleDriver } from "@stackra/scheduler/contracts";

export class SqsQueueDriver extends QueueDriver {
  async reserve() {}
  async load() {}
}

export class CronScheduleDriver extends ScheduleDriver {
  async claim() {}
}
`;

const unrelated = `import { QueueDriver } from "./queue";

export class LocalQueue extends QueueDriver {}
`;

export const QUEUE_SCHEDULER_ROW_OWNERS_FIXTURE: CodemodFixture = {
  files: [
    { path: "services/jobs/src/sqs.driver.ts", before: queue, after: queue, findings: ["3:8"] },
    {
      path: "services/jobs/src/cron.driver.ts",
      before: schedule,
      after: schedule,
      findings: ["3:8"],
    },
    { path: "services/ops/src/drivers.ts", before: ported, after: ported },
    { path: "services/ops/src/local.ts", before: unrelated, after: unrelated },
  ],
};
