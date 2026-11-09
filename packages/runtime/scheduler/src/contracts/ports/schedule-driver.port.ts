/**
 * Stackra file contract:
 * Purpose: the `ScheduleDriver` port: the store behind `SchedulerService`. It keeps the per-scope schedules and one
 *          watermark per schedule (the instant of the last tick that evaluated it), so a tick knows which runs it
 *          has not pushed yet. Config `scheduler.driver` picks the driver (`postgres`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `scheduler.ScheduleDriver`. A driver stores; it never parses
 *           a cron, reads a clock or pushes a job. A watermark key is a cron's job key or a stored schedule's id.
 *           Schedules are tenant-owned (ADR 0239 amendment, gaps A and C): `claim` reads every owner's for the tick
 *           (one runner for the whole platform) and hands back ids, owners and what decides their runs only; every
 *           other schedule method runs in the caller's isolation, so a schedule is loaded, listed or deleted only in
 *           its owner's (a platform schedule in the platform's). Watermarks are platform rows. A leaf file: it imports
 *           nothing outside `src/contracts` but the `Port` base.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 4 and 5); ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0142
 *                     (drivers behind ports); ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import type { Schedule } from "#contracts/types/schedule.type";
import type { ScheduleClaim } from "#contracts/types/schedule-claim.type";

/**
 * A schedule store.
 *
 * @example
 * export class ValkeyScheduleDriver extends Driver(ScheduleDriver) {
 *   async add(schedule: Schedule): Promise<void> { ... }
 * }
 */
export abstract class ScheduleDriver extends Port {
  /** Type-only port key, so `DriverName<ScheduleDriver>` narrows to this port's drivers. */
  declare readonly "~key": "scheduler.ScheduleDriver";

  /** Stores `schedule` in this driver. */
  abstract add(schedule: Schedule): Promise<void>;

  /** Deletes schedule `id` of `scope`, its watermark and its fires; `false` when `scope` holds no such schedule. */
  abstract remove(id: PublicId<"sch">, scope: ScopeRef): Promise<boolean>;

  /** The schedules of `scope` the caller's isolation reads, oldest first. */
  abstract schedules(scope: ScopeRef): Promise<readonly Schedule[]>;

  /** Claims every stored schedule of every owner, oldest first: ids, owners and what decides their runs only. */
  abstract claim(): Promise<readonly ScheduleClaim[]>;

  /** Schedule `id` as the caller's isolation reads it; `undefined` when it is gone or another owner's. */
  abstract load(id: PublicId<"sch">): Promise<Schedule | undefined>;

  /**
   * Records that the runs of fire key `key` (a stored schedule's id, a cron's job key, or `<job key>:<scope id>` for a
   * per-scope cron) fired at `at`, in the caller's transaction and owner; `false`, recording nothing, when that fire was
   * recorded before. The record outlasts the job it pushed, so a tick that pushes again never pushes a fire twice.
   */
  abstract recordFire(key: string, at: Date): Promise<boolean>;

  /** Deletes the records of fire key `key` at or before `through`, in the caller's owner: no tick evaluates them. */
  abstract forgetFires(key: string, through: Date): Promise<void>;

  /**
   * Runs `work` in a transaction of its own, never joining a running one, so one owner's fire records commit with that
   * owner's pushes and nothing of the tick's lock (a store with no transactions runs `work` as it is).
   */
  abstract transaction<T>(work: () => Promise<T>): Promise<T>;

  /** Every watermark, by key. */
  abstract watermarks(): Promise<ReadonlyMap<string, Date>>;

  /** Moves the watermark of every key of `keys` to `at`, never back. */
  abstract advance(keys: readonly string[], at: Date): Promise<void>;
}
