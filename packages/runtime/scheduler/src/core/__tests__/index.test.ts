/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: exactly its values, the shipped schema under its generated name,
 *          and the cron parser and run finder working together as a tick uses them.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { SCHEDULER_CONFIG_SCHEMA } from "#core/constants/scheduler-config-schema.constant";
import * as scheduler from "#core/index";

describe("@stackra/scheduler", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(scheduler).sort()).toEqual([
      "InvalidCronError",
      "InvalidTimeZoneError",
      "MemoryCronScopesDriver",
      "MemoryScheduleDriver",
      "SchedulerConfig",
      "SchedulerConfig$",
      "SchedulerOptions",
      "SchedulerService",
      "cronRuns",
      "encoreCronJobs",
      "parseCron",
      "registerScheduledJobs",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(scheduler.SchedulerConfig$).toBe(SCHEDULER_CONFIG_SCHEMA);
  });

  it("finds the runs of the template's nightly purge", () => {
    const runs = scheduler.cronRuns(
      scheduler.parseCron("30 3 * * *"),
      "UTC",
      new Date("2026-10-24T00:00:00Z"),
      new Date("2026-10-26T00:00:00Z"),
    );
    expect(runs.map((run) => run.toISOString())).toEqual([
      "2026-10-24T03:30:00.000Z",
      "2026-10-25T03:30:00.000Z",
    ]);
  });
});
