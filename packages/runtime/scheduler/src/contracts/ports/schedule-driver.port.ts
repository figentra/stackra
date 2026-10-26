/**
 * Stackra file contract:
 * Purpose: the `ScheduleDriver` port: the store behind `SchedulerService`. It keeps the per-scope schedules and one
 *          watermark per schedule (the instant of the last tick that evaluated it), so a tick knows which runs it
 *          has not pushed yet. Config `scheduler.driver` picks the driver (`postgres`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `scheduler.ScheduleDriver`. A driver stores; it never parses
 *           a cron, reads a clock or pushes a job. A watermark key is a cron's job key or a stored schedule's id.
 *           `schedules()` without a scope reads every scope: the tick runs on one runner for the whole platform. A
 *           leaf file: it imports nothing outside `src/contracts` but the `Port` base.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 4 and 5); ADR 0142 (drivers behind ports); ADR 0294 (decisions 4, 15 and
 *                     16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import type { Schedule } from "#contracts/types/schedule.type";

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

  /** Deletes schedule `id` of `scope` and its watermark; `false` when `scope` holds no such schedule. */
  abstract remove(id: PublicId<"sch">, scope: ScopeRef): Promise<boolean>;

  /** The schedules of `scope` (of every scope when `undefined`), oldest first. */
  abstract schedules(scope?: ScopeRef): Promise<readonly Schedule[]>;

  /** Every watermark, by key. */
  abstract watermarks(): Promise<ReadonlyMap<string, Date>>;

  /** Sets the watermark of every key of `keys` to `at`. */
  abstract advance(keys: readonly string[], at: Date): Promise<void>;
}
