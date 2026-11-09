/**
 * Stackra file contract:
 * Purpose: the memory driver of the `ScheduleDriver` port: schedules and watermarks in process memory.
 * Boundary: one process only and nothing survives a restart: tests and a single-process deployment. The input is stored
 *           as JSON, as the Postgres driver stores it, so a test sees what a tick in another process would. It reads no
 *           clock: the scheduler passes every instant. There are no owner settings in memory, so a schedule keeps no
 *           owner: every claim is a platform schedule's, which needs no isolation.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 5); ADR 0266 (memory drivers first); ADR 0142 (drivers behind ports).
 */
import { Driver } from "@stackra/container";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import { ScheduleDriver } from "#contracts/index";
import type { Schedule, ScheduleClaim } from "#contracts/index";

/**
 * Keeps schedules in process memory.
 *
 * @example
 * export class SchedulerConfig extends BaseSchedulerConfig {
 *   override driver: DriverName<ScheduleDriver> = "memory";
 * }
 */
export class MemoryScheduleDriver extends Driver(ScheduleDriver) {
  /** Schedule id to schedule, in the order they were added. */
  private readonly stored = new Map<string, Schedule>();

  /** Watermark key to instant. */
  private readonly marks = new Map<string, Date>();

  /** Stores a frozen copy of `schedule` (see `ScheduleDriver.add`). */
  add(schedule: Schedule): Promise<void> {
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
    const input = JSON.parse(JSON.stringify(schedule.input)) as object;
    this.stored.set(schedule.id, Object.freeze({ ...schedule, input }));
    return Promise.resolve();
  }

  /** Deletes schedule `id` of `scope` and its watermark (see `ScheduleDriver.remove`). */
  remove(id: PublicId<"sch">, scope: ScopeRef): Promise<boolean> {
    if (this.stored.get(id)?.scope.id !== scope.id) return Promise.resolve(false);
    this.marks.delete(id);
    return Promise.resolve(this.stored.delete(id));
  }

  /** Lists the schedules of `scope` (see `ScheduleDriver.schedules`). */
  schedules(scope: ScopeRef): Promise<readonly Schedule[]> {
    return Promise.resolve(
      [...this.stored.values()].filter((schedule) => schedule.scope.id === scope.id),
    );
  }

  /** Claims every schedule, oldest first (see `ScheduleDriver.claim`); memory keeps no owner. */
  claim(): Promise<readonly ScheduleClaim[]> {
    return Promise.resolve(
      [...this.stored.values()].map(({ id, key, cron, timeZone, misfire, createdAt }) =>
        Object.freeze({ id, key, cron, timeZone, misfire, createdAt }),
      ),
    );
  }

  /** Schedule `id`, if stored (see `ScheduleDriver.load`). */
  load(id: PublicId<"sch">): Promise<Schedule | undefined> {
    return Promise.resolve(this.stored.get(id));
  }

  /** Returns a copy of every watermark, by key (see `ScheduleDriver.watermarks`). */
  watermarks(): Promise<ReadonlyMap<string, Date>> {
    return Promise.resolve(new Map(this.marks));
  }

  /** Sets the watermark of each key to `at` (see `ScheduleDriver.advance`). */
  advance(keys: readonly string[], at: Date): Promise<void> {
    for (const key of keys) this.marks.set(key, new Date(at));
    return Promise.resolve();
  }
}
