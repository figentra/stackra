/**
 * Stackra file contract:
 * Purpose: `SchedulerService`, cron dispatch: each `tick` finds the runs that came due since the last tick, for every
 *          registered action whose `job` option has a `cron` (in UTC, once for the platform or once per scope) and
 *          every stored per-scope schedule (in its time zone), applies the missed-run policy within the catch-up
 *          window, pushes one job per run through `QueueService` and moves each watermark to the tick. `run` ticks once
 *          a minute until its signal aborts; `schedule` and `unschedule` keep the per-scope schedules.
 * Boundary: a platform service over `QueueService`, `Locks`, the `ScheduleDriver` and `CronScopes` ports, the `Clock`,
 *           `SchedulerConfig` and the `Logger`. It only dispatches: the work is the job action's, run by the queue
 *           worker (ADR 0078 decision 6). One runner per tick: every instance ticks, `Locks.tryWith` lets one through,
 *           and the watermarks make a second tick of the same minute push nothing. With the Postgres drivers the
 *           pushes and the watermarks commit in the lock's transaction, so a tick that dies pushes nothing. In SaaS
 *           gen's Encore CronJob calls `tick` every minute; on-prem `run` is the timer (ADR 0148 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 4 and 5); ADR 0078 (decision 6, as amended); ADR 0103 (decision 4);
 *                     ADR 0305 (rules 28 and 30); ADR 0327 and ADR 0323 (`ScopeRef`).
 */
import type { Action, ActionOptions, CallInput } from "@stackra/actions";
import { kindOf, Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { Clock, Logger, PublicId, ScopeRef } from "@stackra/contracts";
import type { Locks } from "@stackra/locking";
import type { QueueService } from "@stackra/queue";

import type { SchedulerConfig } from "#config/scheduler.config";
import { Misfire } from "#contracts/index";
import type { CronScopes, Schedule, ScheduleDriver } from "#contracts/index";
import { SCHEDULED_JOBS } from "#core/constants/scheduled-jobs.constant";
import { InvalidTimeZoneError } from "#core/errors/invalid-time-zone.error";
import { cronRuns } from "#core/functions/cron-runs.function";
import { mintScheduleId } from "#core/functions/mint-schedule-id.function";
import { parseCron } from "#core/functions/parse-cron.function";
import type { ScheduleOptions } from "#core/types/schedule-options.type";
import type { TickResult } from "#core/types/tick-result.type";

/** One minute in milliseconds: the tick interval and the resolution of a cron. */
const MINUTE = 60_000;

/** The platform-wide lock one runner holds for a tick. */
const TICK_LOCK = "scheduler:tick";

/** How long a tick's lock lasts before `Locks` renews it. */
const TICK_LEASE = Duration.minutes(1);

/** The log event of a tick that failed in `run`. */
const TICK_FAILED = "scheduler.tick_failed";

/** Whether the runtime knows `timeZone`. */
function isTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).resolvedOptions();
    return true;
  } catch {
    return false;
  }
}

/** The runs of `runs` (oldest first) a tick at `now` pushes under `misfire`. */
function due(runs: readonly Date[], misfire: Misfire, now: number): readonly Date[] {
  const last = runs.at(-1);
  if (misfire === Misfire.CatchUp || last === undefined) return runs;
  if (misfire === Misfire.Once) return [last];
  return now - last.getTime() < MINUTE ? [last] : [];
}

/** Resolves after `milliseconds`, or at once when `signal` aborts. */
function pause(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, milliseconds);
    signal.addEventListener("abort", done, { once: true });
  });
}

/**
 * Dispatches crons and per-scope schedules.
 *
 * @example
 * await scheduler.run({ signal: shutdown.signal }); // on-prem: tick once a minute
 * await scheduler.schedule(SendDigestAction, { scope: ctx.scope, cron: "0 8 * * mon", timeZone: "Asia/Dubai" });
 */
export class SchedulerService extends Service {
  /** Where each run is pushed. */
  private readonly queue: QueueService;

  /** Lets one runner through per tick. */
  private readonly locks: Locks;

  /** The stored schedules and the watermarks. */
  private readonly driver: ScheduleDriver;

  /** The scopes a per-scope cron fans out over. */
  private readonly cronScopes: CronScopes;

  /** Reads "now" for a tick and a new schedule. */
  private readonly clock: Clock;

  /** The catch-up window and the default missed-run policy. */
  private readonly config: SchedulerConfig;

  /** Where `run` reports a failed tick. */
  private readonly logger: Logger;

  /**
   * @param queue - pushes each run.
   * @param locks - one runner per tick.
   * @param driver - the schedule store.
   * @param cronScopes - the scopes of a per-scope cron.
   * @param clock - the time source of ticks and schedules.
   * @param config - the catch-up window and default policy.
   * @param logger - reports a failed tick.
   */
  constructor(
    queue: QueueService,
    locks: Locks,
    driver: ScheduleDriver,
    cronScopes: CronScopes,
    clock: Clock,
    config: SchedulerConfig,
    logger: Logger,
  ) {
    super();
    this.queue = queue;
    this.locks = locks;
    this.driver = driver;
    this.cronScopes = cronScopes;
    this.clock = clock;
    this.config = config;
    this.logger = logger;
  }

  /**
   * Pushes every run due at `at` (now when absent) that no earlier tick pushed, when no other runner holds the tick.
   *
   * @returns what the tick did; `ran` is `false` when another runner held it.
   */
  async tick(at: Date = this.clock.now()): Promise<TickResult> {
    let result: TickResult = { ran: false, pushed: 0, skipped: [] };
    await this.locks.tryWith(TICK_LOCK, TICK_LEASE, async () => {
      result = await this.dispatch(at);
    });
    return result;
  }

  /** Ticks at the start of every minute until `signal` aborts; a failed tick is logged and the next one runs. */
  async run(options: { readonly signal: AbortSignal }): Promise<void> {
    const { signal } = options;
    while (!signal.aborted) {
      try {
        // oxlint-disable-next-line no-await-in-loop -- one tick a minute, each after the one before
        await this.tick();
      } catch (cause) {
        this.logger.error(TICK_FAILED, { cause });
      }
      // oxlint-disable-next-line no-await-in-loop -- see above
      await pause(MINUTE - (this.clock.now().getTime() % MINUTE), signal);
    }
  }

  /**
   * Stores a schedule of `type` in `options.scope`; its first run is the first match after now.
   *
   * @throws TypeError when `type` is not a job action `registerScheduledJobs` registered.
   * @throws InvalidCronError when `options.cron` is not five valid fields.
   * @throws InvalidTimeZoneError when the runtime does not know `options.timeZone`.
   */
  async schedule<C extends AnyClass<Action>>(
    type: C,
    options: ScheduleOptions<CallInput<InstanceType<C>>>,
  ): Promise<Schedule> {
    const key = SCHEDULED_JOBS.keys.get(type);
    if (key === undefined)
      throw new TypeError(
        `${type.name} is not a registered job action: registerScheduledJobs lists what a schedule may run`,
      );
    const cron = options.cron.trim();
    parseCron(cron);
    const timeZone = options.timeZone ?? "UTC";
    if (!isTimeZone(timeZone)) throw InvalidTimeZoneError.create({ timeZone });
    const schedule: Schedule = Object.freeze({
      id: mintScheduleId(),
      scope: { id: options.scope.id, path: options.scope.path },
      key,
      cron,
      timeZone,
      input: (options.input ?? {}) as object,
      misfire: options.misfire ?? this.config.misfire,
      createdAt: this.clock.now(),
    });
    await this.driver.add(schedule);
    return schedule;
  }

  /** Deletes schedule `id` of `scope`; `false` when `scope` holds no such schedule. */
  unschedule(scope: ScopeRef, id: PublicId<"sch">): Promise<boolean> {
    return this.driver.remove(id, scope);
  }

  /** The stored schedules of `scope`, oldest first. */
  schedules(scope: ScopeRef): Promise<readonly Schedule[]> {
    return this.driver.schedules(scope);
  }

  /** One tick under the lock. */
  private async dispatch(now: Date): Promise<TickResult> {
    const at = now.getTime();
    const floor = at - Duration.toMilliseconds(this.config.catchUpWindow);
    const marks = await this.driver.watermarks();
    // Runs after the key's watermark, else after `fallback`, but never before the window.
    const after = (key: string, fallback: number): Date =>
      new Date(Math.max(marks.get(key)?.getTime() ?? fallback, floor));
    const evaluated: string[] = [];
    const skipped: PublicId<"sch">[] = [];
    let scopes: readonly ScopeRef[] | undefined;
    let pushed = 0;
    for (const [type, key] of SCHEDULED_JOBS.keys) {
      const options = kindOf(type)?.options as unknown as Pick<ActionOptions, "job"> | undefined;
      const cron = options?.job?.cron;
      if (cron === undefined) continue;
      evaluated.push(key);
      // A cron new to the store looks back one minute, so its first tick pushes only the current minute's run.
      const runs = due(
        cronRuns(parseCron(cron.schedule), "UTC", after(key, at - MINUTE), now),
        this.config.misfire,
        at,
      );
      if (runs.length === 0) continue;
      // Once per scope `CronScopes` lists, each run in its scope.
      const perScope = cron.perScope === true;
      // oxlint-disable-next-line no-await-in-loop -- listed once per tick, on the first per-scope cron that is due
      if (perScope) scopes ??= await this.cronScopes.list();
      const targets = perScope ? (scopes ?? []) : [undefined];
      // oxlint-disable-next-line no-await-in-loop -- pushes join the tick's transaction one at a time
      pushed += await this.push(type, cron.input ?? {}, targets, runs.length);
    }
    for (const schedule of await this.driver.schedules()) {
      const type = SCHEDULED_JOBS.byKey.get(schedule.key);
      const runs =
        type === undefined
          ? undefined
          : this.runsOf(schedule, after(schedule.id, schedule.createdAt.getTime()), now);
      if (type === undefined || runs === undefined) {
        skipped.push(schedule.id);
        continue;
      }
      evaluated.push(schedule.id);
      const count = due(runs, schedule.misfire, at).length;
      // oxlint-disable-next-line no-await-in-loop -- pushes join the tick's transaction one at a time
      pushed += await this.push(type, schedule.input, [schedule.scope], count);
    }
    await this.driver.advance(evaluated, now);
    return { ran: true, pushed, skipped };
  }

  /** The runs of a stored schedule in `(after, now]`, or `undefined` when its cron or time zone is refused. */
  private runsOf(schedule: Schedule, after: Date, now: Date): readonly Date[] | undefined {
    try {
      return cronRuns(parseCron(schedule.cron), schedule.timeZone, after, now);
    } catch {
      return undefined;
    }
  }

  /** Pushes `runs` jobs of `type` into each of `scopes` (`undefined` for the platform); how many were stored. */
  private async push(
    type: AnyClass<Action>,
    input: object,
    scopes: readonly (ScopeRef | undefined)[],
    runs: number,
  ): Promise<number> {
    let pushed = 0;
    for (let run = 0; run < runs; run += 1)
      for (const scope of scopes) {
        // oxlint-disable-next-line no-await-in-loop -- pushes join the tick's transaction one at a time
        const id = await this.queue.push(
          type,
          input as never,
          scope === undefined ? {} : { scope },
        );
        if (id !== undefined) pushed += 1;
      }
    return pushed;
  }
}
