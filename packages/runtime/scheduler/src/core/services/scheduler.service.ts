/**
 * Stackra file contract:
 * Purpose: `SchedulerService`, cron dispatch: each `tick` finds the runs that came due since the last tick, for every
 *          registered action whose `job` option has a `cron` (in UTC, once for the platform or once per scope) and
 *          every stored per-scope schedule (in its time zone), applies the missed-run policy within the catch-up
 *          window, pushes one job per run through `QueueService` and moves each watermark to the tick. `run` ticks once
 *          a minute until its signal aborts; `schedule` and `unschedule` keep the per-scope schedules.
 * Boundary: a platform service over `QueueService`, `Locks`, the `ScheduleDriver` and `CronScopes` ports, the `Clock`,
 *           `SchedulerConfig`, the `Logger` and the `Container` (the bound `CallIsolation`, read optionally at run
 *           time). It only dispatches: the work is the job action's, run by the queue worker (ADR 0078
 *           decision 6). One runner per tick: every instance ticks, `Locks.tryWith` lets one through, and the
 *           watermarks make a second tick of the same minute push nothing. Schedules and jobs are tenant-owned (ADR
 *           0239 amendment, gaps A and C, decision 5): the lock covers only the claim of every owner's schedules (ids,
 *           owners and what decides their runs), and, taken again after the pushes, the watermark advance. Between
 *           them each schedule's due runs, and each scope's runs of a per-scope cron, are pushed in a transaction of
 *           their own (`ScheduleDriver.transaction`, `requiresNew` on Postgres) in their owner's isolation (a schedule's claimed owner, a
 *           cron scope's tenant as the isolation resolves it, the platform for a platform cron), since `CallIsolation`
 *           refuses a tenant switch inside one transaction. Dispatch is at least once with no duplicate: each fire
 *           time is recorded (`ScheduleDriver.recordFire`, keyed by schedule or cron and scope, and fire time) in the
 *           push's own transaction and pushed only when the record is new, and the watermark moves after the push, so
 *           a tick that dies between them pushes again and the record drops the copy, even when the first job has
 *           finished. A claimed schedule that does not load, or an owned one with no isolation bound, fails the tick
 *           (`ScheduleClaimNotLoadedError`, `ScheduleRowIsolationMissingError`) after every other owner's runs are
 *           pushed, its watermark kept: none is skipped silently. In SaaS
 *           each cron of an action has its own Encore CronJob (`encoreCronJobs`) whose endpoint calls `fire`, and a
 *           minute CronJob ticks the stored schedules only (`{ crons: false }`); on-prem `run` is the timer (ADR 0148
 *           decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 4 and 5); ADR 0078 (decision 6, as amended); ADR 0103 (decision 4);
 *                     ADR 0305 (rules 28 and 30); ADR 0327 and ADR 0323 (`ScopeRef`); ADR 0239 (2026-11-07 amendment,
 *                     gaps A and C, decision 5); ADR 0495.
 */
import type { Action, ActionOptions, CallInput } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";
import { kindOf, Service } from "@stackra/container";
import type { AnyClass, Container } from "@stackra/container";
import { ActorKind, Duration } from "@stackra/contracts";
import type { Actor, Clock, Logger, PublicId, ScopeRef } from "@stackra/contracts";
import type { Locks } from "@stackra/locking";
import type { QueueService } from "@stackra/queue";

import type { SchedulerConfig } from "#config/scheduler.config";
import { Misfire } from "#contracts/index";
import type { CronScopes, Schedule, ScheduleClaim, ScheduleDriver } from "#contracts/index";
import { SCHEDULED_JOBS } from "#core/constants/scheduled-jobs.constant";
import { InvalidTimeZoneError } from "#core/errors/invalid-time-zone.error";
import { ScheduleClaimNotLoadedError } from "#core/errors/schedule-claim-not-loaded.error";
import { ScheduleRowIsolationMissingError } from "#core/errors/schedule-row-isolation-missing.error";
import { cronRuns } from "#core/functions/cron-runs.function";
import { mintScheduleId } from "#core/functions/mint-schedule-id.function";
import { parseCron } from "#core/functions/parse-cron.function";
import type { ScheduleOptions } from "#core/types/schedule-options.type";
import type { TickOptions } from "#core/types/tick-options.type";
import type { TickResult } from "#core/types/tick-result.type";

/** One minute in milliseconds: the tick interval and the resolution of a cron. */
const MINUTE = 60_000;

/** How far back `fire` looks for its cron's current slot: one day, the longest catch-up window. */
const SLOT_LOOKBACK = 24 * 60 * MINUTE;

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

/** The scheduler's actor id: a job it pushes runs on its behalf. */
const SCHEDULER_ACTOR_ID = "sys_scheduler";

/**
 * The actor a scheduled run of `scope` is stamped with as the job's origin: the scheduler, acting in the scope the
 * schedule was created for, so the queue worker runs the job through `CallIsolation` bound to that scope (ADR 0495). A
 * schedule is created in the scope its work belongs to (the tenant's own scope); a scope that is not a tenant's matches
 * no tenant row, so it fails closed.
 */
const schedulerActor = (scope: ScopeRef): Actor =>
  Object.freeze({ kind: ActorKind.System, id: SCHEDULER_ACTOR_ID, scopeId: scope.id });

/** The actor a claimed schedule's runs are pushed as: the scheduler, in the schedule's owner when it has one. */
const ownerActor = (ownerId: PublicId<"scp"> | undefined): Actor =>
  Object.freeze({
    kind: ActorKind.System,
    id: SCHEDULER_ACTOR_ID,
    ...(ownerId === undefined ? {} : { scopeId: ownerId }),
  });

/**
 * The runs one tick or `fire` pushes for one owner: a claimed schedule's, or a cron's in one scope (none: platform).
 * A tick's push, and a `fire` with a slot, names its fire key, so each fire time is pushed once (`recordFire`), and its
 * watermark key, which a tick moves only once its runs are pushed.
 */
type Push = (
  | { readonly claim: ScheduleClaim }
  | { readonly input: object; readonly scope: ScopeRef | undefined }
) & {
  readonly type: AnyClass<Action>;
  readonly fires: readonly Date[];
  readonly once?: {
    readonly fireKey: string;
    readonly markKey: string;
    readonly after: Date;
  };
};

/** The fire key of a cron's runs: its job key, with the scope's id for a per-scope cron. */
const cronFireKey = (key: string, scope: ScopeRef | undefined): string =>
  scope === undefined ? key : `${key}:${scope.id}`;

/** What a tick decided under its lock: the pushes to make after it, and the keys it evaluated or skipped. */
interface Plan {
  readonly pushes: readonly Push[];
  readonly evaluated: readonly string[];
  readonly skipped: readonly PublicId<"sch">[];
}

/** What a run of pushes did: how many jobs it stored, the watermark keys whose push failed, the first failure. */
interface Pushed {
  readonly pushed: number;
  readonly failed: ReadonlySet<string>;
  readonly failure: { readonly error: unknown } | undefined;
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

  /** The container the bound `CallIsolation`, if any, is read from at run time. */
  private readonly container: Container;

  /**
   * @param queue - pushes each run.
   * @param locks - one runner per tick.
   * @param driver - the schedule store.
   * @param cronScopes - the scopes of a per-scope cron.
   * @param clock - the time source of ticks and schedules.
   * @param config - the catch-up window and default policy.
   * @param logger - reports a failed tick.
   * @param container - the container whose `CallIsolation` each owner's pushes run in, when one is bound.
   */
  constructor(
    queue: QueueService,
    locks: Locks,
    driver: ScheduleDriver,
    cronScopes: CronScopes,
    clock: Clock,
    config: SchedulerConfig,
    logger: Logger,
    container: Container,
  ) {
    super();
    this.queue = queue;
    this.locks = locks;
    this.driver = driver;
    this.cronScopes = cronScopes;
    this.clock = clock;
    this.config = config;
    this.logger = logger;
    this.container = container;
  }

  /**
   * Pushes every run due at `at` (now when absent) that no earlier tick pushed, when no other runner holds the tick;
   * with `{ crons: false }` only the stored schedules' runs.
   *
   * @returns what the tick did; `ran` is `false` when another runner held it.
   * @throws ScheduleClaimNotLoadedError or ScheduleRowIsolationMissingError for a claimed schedule that cannot load in
   *         its owner, once every other push was made.
   */
  async tick(at: Date = this.clock.now(), options: TickOptions = {}): Promise<TickResult> {
    let plan = undefined as Plan | undefined;
    await this.locks.tryWith(TICK_LOCK, TICK_LEASE, async () => {
      plan = await this.plan(at, options.crons ?? true);
    });
    if (plan === undefined) return { ran: false, pushed: 0, skipped: [] };
    const { pushed, failed, failure } = await this.pushAll(plan.pushes);
    // Pushed first, then the watermarks (at least once): a tick that dies before this line pushes again next time,
    // and each fire's record drops the copy. A key whose push failed keeps its watermark, so its runs come again.
    const advanced = plan.evaluated.filter((key) => !failed.has(key));
    await this.locks.with(TICK_LOCK, TICK_LEASE, () => this.driver.advance(advanced, at));
    if (failure !== undefined) throw failure.error;
    return { ran: true, pushed, skipped: plan.skipped };
  }

  /**
   * Pushes one run of the cron action registered as `key` for its current slot: once, or once per scope `CronScopes`
   * lists. The endpoint of that action's Encore CronJob calls it; Encore runs one invocation at a time, so it takes no
   * lock and moves no watermark. The slot is the cron's last due time at or before now (UTC, as a tick reads an
   * action's cron), and each run records its fire under the same fire key and time a tick would, so a retried
   * invocation, or a tick of the same slot, pushes nothing again. A call with no due time in the last day (a manual
   * run off the schedule) has no slot: it pushes once at now, unrecorded.
   *
   * @returns how many jobs were stored.
   * @throws TypeError when `key` is not a registered action with a `cron`.
   */
  async fire(key: string): Promise<number> {
    const type = SCHEDULED_JOBS.byKey.get(key);
    const options =
      type === undefined
        ? undefined
        : (kindOf(type)?.options as unknown as Pick<ActionOptions, "job"> | undefined);
    const cron = options?.job?.cron;
    if (type === undefined || cron === undefined)
      throw new TypeError(`${key} is not a registered job action with a cron`);
    const scopes: readonly (ScopeRef | undefined)[] =
      cron.perScope === true ? await this.cronScopes.list() : [undefined];
    const now = this.clock.now();
    const since = new Date(now.getTime() - SLOT_LOOKBACK);
    const slot = cronRuns(parseCron(cron.schedule), "UTC", since, now).at(-1);
    const { pushed, failure } = await this.pushAll(
      scopes.map((scope) => ({
        type,
        fires: [slot ?? now],
        input: cron.input ?? {},
        scope,
        ...(slot === undefined
          ? {}
          : {
              once: {
                fireKey: cronFireKey(key, scope),
                markKey: key,
                after: since,
              },
            }),
      })),
    );
    if (failure !== undefined) throw failure.error;
    return pushed;
  }

  /** Ticks at the start of every minute until `signal` aborts; a failed tick is logged and the next one runs. */
  async run(options: { readonly signal: AbortSignal }): Promise<void> {
    const { signal } = options;
    while (!signal.aborted) {
      try {
        // oxlint-disable-next-line no-await-in-loop -- one tick a minute, each after the one before
        await this.tick();
      } catch (error) {
        this.logger.error(TICK_FAILED, { cause: error });
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

  /** One tick under the lock: claims every owner's schedules and works out the due runs; pushes nothing. */
  private async plan(now: Date, crons: boolean): Promise<Plan> {
    const at = now.getTime();
    const floor = at - Duration.toMilliseconds(this.config.catchUpWindow);
    const marks = await this.driver.watermarks();
    // Runs after the key's watermark, else after `fallback`, but never before the window.
    const after = (key: string, fallback: number): Date =>
      new Date(Math.max(marks.get(key)?.getTime() ?? fallback, floor));
    const evaluated: string[] = [];
    const skipped: PublicId<"sch">[] = [];
    const pushes: Push[] = [];
    let scopes: readonly ScopeRef[] | undefined;
    for (const [type, key] of crons ? SCHEDULED_JOBS.keys : []) {
      const options = kindOf(type)?.options as unknown as Pick<ActionOptions, "job"> | undefined;
      const cron = options?.job?.cron;
      if (cron === undefined) continue;
      evaluated.push(key);
      // A cron new to the store looks back one minute, so its first tick pushes only the current minute's run.
      const since = after(key, at - MINUTE);
      const runs = due(
        cronRuns(parseCron(cron.schedule), "UTC", since, now),
        this.config.misfire,
        at,
      );
      if (runs.length === 0) continue;
      // Once per scope `CronScopes` lists, each run in its scope.
      const perScope = cron.perScope === true;
      // oxlint-disable-next-line no-await-in-loop -- listed once per tick, on the first per-scope cron that is due
      if (perScope) scopes ??= await this.cronScopes.list();
      const targets = perScope ? (scopes ?? []) : [undefined];
      for (const scope of targets)
        pushes.push({
          type,
          fires: runs,
          input: cron.input ?? {},
          scope,
          once: {
            fireKey: cronFireKey(key, scope),
            markKey: key,
            after: since,
          },
        });
    }
    for (const claim of await this.driver.claim()) {
      const type = SCHEDULED_JOBS.byKey.get(claim.key);
      const since = after(claim.id, claim.createdAt.getTime());
      const runs = type === undefined ? undefined : this.runsOf(claim, since, now);
      if (type === undefined || runs === undefined) {
        skipped.push(claim.id);
        continue;
      }
      evaluated.push(claim.id);
      const fires = due(runs, claim.misfire, at);
      if (fires.length > 0)
        pushes.push({
          type,
          fires,
          claim,
          once: { fireKey: claim.id, markKey: claim.id, after: since },
        });
    }
    return { pushes, evaluated, skipped };
  }

  /** The runs of a claimed schedule in `(after, now]`, or `undefined` when its cron or time zone is refused. */
  private runsOf(schedule: ScheduleClaim, after: Date, now: Date): readonly Date[] | undefined {
    try {
      return cronRuns(parseCron(schedule.cron), schedule.timeZone, after, now);
    } catch {
      return undefined;
    }
  }

  /** Makes every push, each in its owner, one after another; a push that fails does not stop the others. */
  private async pushAll(pushes: readonly Push[]): Promise<Pushed> {
    let pushed = 0;
    let failure: { readonly error: unknown } | undefined;
    const failed = new Set<string>();
    for (const push of pushes)
      try {
        // oxlint-disable-next-line no-await-in-loop -- one owner's transaction at a time
        pushed += await this.inOwner(push, () => this.pushRuns(push));
      } catch (error) {
        failure ??= { error };
        if (push.once !== undefined) failed.add(push.once.markKey);
      }
    return { pushed, failed, failure };
  }

  /**
   * Pushes the runs of `push` in the running isolation: a claimed schedule's, loaded first, or a cron's.
   *
   * @throws ScheduleClaimNotLoadedError when the claimed schedule does not load.
   */
  private async pushRuns(push: Push): Promise<number> {
    const { input, scope }: { readonly input: object; readonly scope: ScopeRef | undefined } =
      "claim" in push ? await this.loaded(push.claim) : push;
    const { once } = push;
    // Fires at or before the window's start are never evaluated again, so their records can go.
    if (once !== undefined) await this.driver.forgetFires(once.fireKey, once.after);
    let pushed = 0;
    for (const at of push.fires) {
      // A fire already recorded was pushed by a tick that died before its watermark moved: the copy is dropped. The
      // record commits with the push, in the owner's one transaction.
      // oxlint-disable-next-line no-await-in-loop -- one fire after another in the owner's transaction
      if (once !== undefined && !(await this.driver.recordFire(once.fireKey, at))) continue;
      // oxlint-disable-next-line no-await-in-loop -- pushes join the owner's transaction one at a time
      const id = await this.queue.push(
        push.type,
        input as never,
        scope === undefined ? {} : { scope, origin: schedulerActor(scope) },
      );
      if (id !== undefined) pushed += 1;
    }
    return pushed;
  }

  /**
   * The claimed schedule, as the running isolation loads it.
   *
   * @throws ScheduleClaimNotLoadedError when it does not load.
   */
  private async loaded(claim: ScheduleClaim): Promise<Schedule> {
    const schedule = await this.driver.load(claim.id);
    if (schedule === undefined) throw ScheduleClaimNotLoadedError.create({ id: claim.id });
    return schedule;
  }

  /**
   * Runs `work` for `push` in a transaction of its own (`ScheduleDriver.transaction`) in its owner's
   * isolation: a claimed schedule's owner, or the tenant the isolation resolves for a cron's scope (the platform for
   * none). With no isolation bound a platform schedule or a cron runs as it is.
   *
   * @throws ScheduleRowIsolationMissingError when a claimed schedule has an owner and no isolation is bound.
   */
  private inOwner<T>(push: Push, work: () => Promise<T>): Promise<T> {
    const isolation = this.container.has(CallIsolation)
      ? this.container.get(CallIsolation)
      : undefined;
    const unit = (): Promise<T> => {
      if ("claim" in push) {
        const { id, ownerId } = push.claim;
        if (isolation !== undefined)
          return isolation.run(ownerActor(ownerId), undefined, () => work(), { readOnly: false });
        if (ownerId !== undefined)
          return Promise.reject(ScheduleRowIsolationMissingError.create({ id }));
        return work();
      }
      const { scope } = push;
      if (isolation === undefined) return work();
      return isolation.run(
        scope === undefined ? ownerActor(undefined) : schedulerActor(scope),
        scope,
        () => work(),
        { readOnly: false },
      );
    };
    // A tenant insert from a no-tenant session: its own transaction, outside the lock's, never a tenant switch.
    return this.driver.transaction(unit);
  }
}
