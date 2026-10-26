/**
 * Stackra file contract:
 * Purpose: unit tests of `SchedulerService`: a tick pushes a platform cron once and a per-scope cron once per listed
 *          scope with its input; a second tick of the minute pushes nothing; a unique job that waits is not pushed
 *          again; missed runs are caught up within the window under each `Misfire` policy; one runner holds a tick;
 *          stored schedules run in their scope and time zone, never before they were made, are refused when invalid,
 *          skipped when their action is unknown, and deleted only from their scope; `run` ticks at once, logs a
 *          failed tick, and stops on abort; `fire` pushes one run of a cron action (per scope too) for its Encore
 *          CronJob, and `tick({ crons: false })` leaves the crons of actions to theirs.
 * Boundary: test only; the real queue service, `Locks` and memory drivers on a clock the test moves. The job registry
 *           is process-wide, so every tick here evaluates the crons registered at the top of this file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0148 (decisions 4 and 5); ADR 0078 (decision 6); ADR 0103 (decision 4).
 */
import { Action } from "@stackra/actions";
import { buildConfig } from "@stackra/config";
import { ActorKind, Clock, Duration, Logger } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { MemoryQueueDriver, QueueService, registerJobs } from "@stackra/queue";
import type { QueuedJob } from "@stackra/queue/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SchedulerConfig } from "#config/scheduler.config";
import { Misfire } from "#contracts/index";
import { MemoryCronScopesDriver } from "#core/drivers/memory-cron-scopes.driver";
import { MemoryScheduleDriver } from "#core/drivers/memory-schedule.driver";
import { InvalidCronError } from "#core/errors/invalid-cron.error";
import { InvalidTimeZoneError } from "#core/errors/invalid-time-zone.error";
import { registerScheduledJobs } from "#core/functions/register-scheduled-jobs.function";
import { SchedulerService } from "#core/services/scheduler.service";
import type { TickResult } from "#core/types/tick-result.type";

class ExpireUnpaidOrdersAction extends Action({
  key: "order.expire_unpaid",
  actors: [ActorKind.System],
  job: {
    queue: "maintenance",
    unique: true,
    cron: { schedule: "*/5 * * * *", perScope: true, input: { batchSize: 100 } },
  },
}) {
  async handle(_input: { batchSize: number }): Promise<void> {}
}

class PurgeEntriesAction extends Action({
  key: "entry.purge",
  actors: [ActorKind.System],
  job: { queue: "maintenance", cron: { schedule: "0 * * * *" } },
}) {
  async handle(_input: object): Promise<void> {}
}

class SendDigestAction extends Action({
  key: "digest.send",
  actors: [ActorKind.System],
  job: { queue: "default" },
}) {
  async handle(_input: { audience?: string }): Promise<void> {}
}

class PlaceOrderAction extends Action({
  key: "order.place",
  actors: [ActorKind.User],
}) {
  async handle(_input: { sku: string }): Promise<void> {}
}

const ROWS = [
  { type: ExpireUnpaidOrdersAction, key: "orders.order.expire_unpaid@1" },
  { type: PurgeEntriesAction, key: "access_log.entry.purge@1" },
  { type: SendDigestAction, key: "digests.digest.send@1" },
];
registerJobs(ROWS);
registerScheduledJobs(ROWS);

const acme: ScopeRef = { id: "scp_acme", path: "platform.acme" };

const globex: ScopeRef = { id: "scp_globex", path: "platform.globex" };

/** An instant on 24 October 2026, UTC. */
const at = (time: string): Date => new Date(`2026-10-24T${time}Z`);

/** Far enough ahead that every stored job is due. */
const FAR = new Date(Date.UTC(2027, 0, 1));

/** A clock the test moves. */
class MovableClock extends Clock {
  at = at("12:00:30").getTime();

  now(): Date {
    return new Date(this.at);
  }
}

/** A logger that keeps its errors. */
class RecordingLogger extends Logger {
  readonly errors: {
    readonly event: string;
    readonly fields: Readonly<Record<string, unknown>> | undefined;
  }[] = [];

  debug(): void {}

  info(): void {}

  warn(): void {}

  error(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.errors.push({ event, fields });
  }
}

/** A scheduler over memory drivers, with `values` as its configuration and `scopes` as the per-scope cron scopes. */
function setup(
  values: { readonly misfire?: Misfire; readonly catchUpWindow?: Duration } = {},
  scopes: readonly ScopeRef[] = [],
) {
  const clock = new MovableClock();
  const jobs = new MemoryQueueDriver();
  const locks = new Locks(new MemoryLockDriver(clock), clock);
  const driver = new MemoryScheduleDriver();
  const cronScopes = new MemoryCronScopesDriver();
  cronScopes.scopes = scopes;
  const logger = new RecordingLogger();
  const scheduler = new SchedulerService(
    new QueueService(jobs, clock),
    locks,
    driver,
    cronScopes,
    clock,
    buildConfig(SchedulerConfig, { values }),
    logger,
  );
  return { clock, jobs, locks, driver, logger, scheduler };
}

/** Every job stored, in the order it was pushed; reserving them, so call it last. */
async function stored(jobs: MemoryQueueDriver): Promise<readonly QueuedJob[]> {
  const found: QueuedJob[] = [];
  for (;;) {
    // oxlint-disable-next-line no-await-in-loop -- reserves one job after another until none is left
    const job = await jobs.reserve(undefined, FAR);
    if (job === undefined) return found;
    found.push(job);
  }
}

describe(SchedulerService, () => {
  it("pushes a platform cron's run once, in its minute, with an empty input", async () => {
    const { scheduler, jobs } = setup();
    await expect(scheduler.tick(at("12:00:30"))).resolves.toEqual({
      ran: true,
      pushed: 1,
      skipped: [],
    });
    const [job] = await stored(jobs);
    expect(job?.key).toBe("access_log.entry.purge@1");
    expect(job?.queue).toBe("maintenance");
    expect(job?.input).toEqual({});
    expect(job?.scope).toBeUndefined();
  });

  it("fans a per-scope cron out over CronScopes, with its input", async () => {
    const { scheduler, jobs } = setup({}, [acme, globex]);
    expect((await scheduler.tick(at("12:00:30"))).pushed).toBe(3);
    const expiring = (await stored(jobs)).filter(
      (job) => job.key === "orders.order.expire_unpaid@1",
    );
    expect(expiring.map((job) => job.scope?.id)).toEqual(["scp_acme", "scp_globex"]);
    expect(expiring.map((job) => job.input)).toEqual([{ batchSize: 100 }, { batchSize: 100 }]);
  });

  it("pushes nothing on a second tick of the same minute and moves each cron's watermark", async () => {
    const { scheduler, driver } = setup();
    await scheduler.tick(at("12:00:30"));
    expect((await scheduler.tick(at("12:00:50"))).pushed).toBe(0);
    const marks = await driver.watermarks();
    expect(marks.get("access_log.entry.purge@1")).toEqual(at("12:00:50"));
    expect(marks.get("orders.order.expire_unpaid@1")).toEqual(at("12:00:50"));
    expect(marks.has("digests.digest.send@1")).toBe(false);
  });

  it("does not count a unique job of a scope that still waits", async () => {
    const { scheduler } = setup({}, [acme]);
    expect((await scheduler.tick(at("12:00:30"))).pushed).toBe(2);
    expect((await scheduler.tick(at("12:05:30"))).pushed).toBe(0);
  });

  it("catches up each missed run, never further back than the window", async () => {
    const wide = setup({ catchUpWindow: Duration.hours(3) });
    await wide.scheduler.tick(at("10:00:30"));
    expect((await wide.scheduler.tick(at("15:00:30"))).pushed).toBe(3);
    const narrow = setup();
    await narrow.scheduler.tick(at("10:00:30"));
    expect((await narrow.scheduler.tick(at("15:00:30"))).pushed).toBe(1);
  });

  it("pushes one job for every missed run together under Misfire.Once", async () => {
    const { scheduler } = setup({ misfire: Misfire.Once, catchUpWindow: Duration.hours(3) });
    await scheduler.tick(at("10:00:30"));
    expect((await scheduler.tick(at("15:00:30"))).pushed).toBe(1);
  });

  it("keeps only a run of the current minute under Misfire.Skip", async () => {
    const { scheduler } = setup({ misfire: Misfire.Skip, catchUpWindow: Duration.hours(3) });
    await scheduler.tick(at("10:00:30"));
    expect((await scheduler.tick(at("13:00:30"))).pushed).toBe(1);
    expect((await scheduler.tick(at("14:01:30"))).pushed).toBe(0);
  });

  it("does nothing while another runner holds the tick", async () => {
    const { scheduler, locks } = setup();
    let inner: TickResult | undefined;
    await locks.tryWith("scheduler:tick", Duration.minutes(1), async () => {
      inner = await scheduler.tick(at("12:00:30"));
    });
    expect(inner).toEqual({ ran: false, pushed: 0, skipped: [] });
  });

  it("stores a schedule in its scope with the defaults", async () => {
    const { scheduler, clock } = setup({ misfire: Misfire.Once });
    const schedule = await scheduler.schedule(SendDigestAction, {
      scope: acme,
      cron: " 0 16 * * * ",
    });
    expect(schedule).toMatchObject({
      scope: acme,
      key: "digests.digest.send@1",
      cron: "0 16 * * *",
      timeZone: "UTC",
      input: {},
      misfire: Misfire.Once,
    });
    expect(schedule.id).toMatch(/^sch_/);
    expect(schedule.createdAt).toEqual(clock.now());
    expect(await scheduler.schedules(acme)).toEqual([schedule]);
    expect(await scheduler.schedules(globex)).toEqual([]);
  });

  it("pushes a schedule's runs in its scope and time zone", async () => {
    const { scheduler, jobs, clock } = setup();
    clock.at = at("11:00:00").getTime();
    await scheduler.schedule(SendDigestAction, {
      scope: acme,
      cron: "0 16 * * *",
      timeZone: "Asia/Dubai",
      input: { audience: "buyers" },
    });
    const result = await scheduler.tick(at("12:00:30"));
    expect(result.skipped).toEqual([]);
    const digests = (await stored(jobs)).filter((job) => job.key === "digests.digest.send@1");
    expect(digests.map((job) => [job.scope?.id, job.input])).toEqual([
      ["scp_acme", { audience: "buyers" }],
    ]);
  });

  it("pushes no run from before a schedule was made", async () => {
    const { scheduler, jobs, clock } = setup();
    clock.at = at("12:00:10").getTime();
    await scheduler.schedule(SendDigestAction, { scope: acme, cron: "0 12 * * *" });
    await scheduler.tick(at("12:00:30"));
    expect((await stored(jobs)).some((job) => job.key === "digests.digest.send@1")).toBe(false);
  });

  it("skips a schedule whose action this process does not know, keeping its watermark", async () => {
    const { scheduler, driver } = setup();
    await driver.add({
      id: "sch_gone",
      scope: acme,
      key: "gone.thing.run@1",
      cron: "* * * * *",
      timeZone: "UTC",
      input: {},
      misfire: Misfire.CatchUp,
      createdAt: at("11:00:00"),
    });
    expect((await scheduler.tick(at("12:00:30"))).skipped).toEqual(["sch_gone"]);
    expect((await driver.watermarks()).has("sch_gone")).toBe(false);
  });

  it("refuses an unregistered action, a bad cron and an unknown time zone", async () => {
    const { scheduler } = setup();
    await expect(
      scheduler.schedule(PlaceOrderAction, { scope: acme, cron: "* * * * *" }),
    ).rejects.toThrow(TypeError);
    await expect(
      scheduler.schedule(SendDigestAction, { scope: acme, cron: "* * *" }),
    ).rejects.toThrow(InvalidCronError);
    await expect(
      scheduler.schedule(SendDigestAction, {
        scope: acme,
        cron: "* * * * *",
        timeZone: "Mars/Olympus",
      }),
    ).rejects.toThrow(InvalidTimeZoneError);
  });

  it("unschedules only from the schedule's own scope", async () => {
    const { scheduler } = setup();
    const { id } = await scheduler.schedule(SendDigestAction, { scope: acme, cron: "0 8 * * *" });
    await expect(scheduler.unschedule(globex, id)).resolves.toBe(false);
    await expect(scheduler.unschedule(acme, id)).resolves.toBe(true);
    expect(await scheduler.schedules(acme)).toEqual([]);
  });

  it("runs a tick at once and stops when the signal aborts", async () => {
    const { scheduler } = setup();
    const tick = vi.spyOn(scheduler, "tick");
    const controller = new AbortController();
    const running = scheduler.run({ signal: controller.signal });
    await vi.waitFor(() => expect(tick).toHaveBeenCalledTimes(1));
    controller.abort();
    await expect(running).resolves.toBeUndefined();
  });

  it("logs a failed tick and keeps running", async () => {
    const { scheduler, driver, logger } = setup();
    vi.spyOn(driver, "watermarks").mockRejectedValueOnce(new Error("store down"));
    const controller = new AbortController();
    const running = scheduler.run({ signal: controller.signal });
    await vi.waitFor(() => expect(logger.errors).toHaveLength(1));
    controller.abort();
    await running;
    expect(logger.errors[0]?.event).toBe("scheduler.tick_failed");
  });
});

describe("SchedulerService.fire and tick({ crons: false })", () => {
  it("fires one run of a platform cron action at once", async () => {
    const { jobs, scheduler } = setup();
    await expect(scheduler.fire("access_log.entry.purge@1")).resolves.toBe(1);
    expect((await stored(jobs)).map((job) => job.key)).toEqual(["access_log.entry.purge@1"]);
  });

  it("fires a per-scope cron once per scope, with its input", async () => {
    const { jobs, scheduler } = setup({}, [acme, globex]);
    await expect(scheduler.fire("orders.order.expire_unpaid@1")).resolves.toBe(2);
    expect((await stored(jobs)).map((job) => [job.scope?.id, job.input])).toEqual([
      ["scp_acme", { batchSize: 100 }],
      ["scp_globex", { batchSize: 100 }],
    ]);
  });

  it("refuses a key that is not a registered cron action", async () => {
    const { scheduler } = setup();
    await expect(scheduler.fire("digests.digest.send@1")).rejects.toThrow(TypeError);
    await expect(scheduler.fire("nope@1")).rejects.toThrow(TypeError);
  });

  it("leaves the crons of actions to their CronJobs when told to", async () => {
    const { clock, jobs, scheduler } = setup({}, [acme]);
    clock.at = at("13:00:10").getTime();
    const result = await scheduler.tick(undefined, { crons: false });
    expect(result).toEqual({ ran: true, pushed: 0, skipped: [] });
    expect(await stored(jobs)).toEqual([]);
  });
});
