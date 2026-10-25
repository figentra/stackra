/**
 * Stackra file contract:
 * Purpose: `Schedule`, a per-scope schedule kept as data: which job action runs, in which scope, on which five-field
 *          cron read in which time zone, with which input and missed-run policy.
 * Boundary: a type only, plain data; `ScheduleDriver` stores it and `SchedulerService.schedule` makes it. The action is
 *           named by its locked job key, never by code, so a schedule is data that only references registered code
 *           (ADR 0154). The scope is a `ScopeRef` (ADR 0323), never request input.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 5: schedules are data, each in its scope's time zone, with a missed-run
 *                     policy); ADR 0327 and ADR 0323 (`ScopeRef`).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

import type { Misfire } from "#contracts/enums/misfire.enum";

/**
 * A stored schedule.
 *
 * @example
 * const schedule = await scheduler.schedule(SendDigestAction, { scope, cron: "0 8 * * 1", timeZone: "Asia/Dubai" });
 */
export interface Schedule {
  /** Its public id. */
  readonly id: PublicId<"sch">;

  /** The scope each run is pushed with. */
  readonly scope: ScopeRef;

  /** The locked key of the job action it runs (`digests.digest.send@1`). */
  readonly key: string;

  /** A five-field cron expression, read in `timeZone`. */
  readonly cron: string;

  /** An IANA time zone (`Asia/Dubai`), or `UTC`. */
  readonly timeZone: string;

  /** The input every run gets. */
  readonly input: object;

  /** What a tick does with runs it missed. */
  readonly misfire: Misfire;

  /** When it was made; no run before it is pushed. */
  readonly createdAt: Date;
}
