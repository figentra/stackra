/**
 * Stackra file contract:
 * Purpose: `ScheduleClaim`, what the tick's claim of the schedule store hands it before any tenant is known: a stored
 *          schedule's id, its owning tenant and what decides its runs (its job key, cron, time zone, missed-run policy
 *          and creation instant), never its input or scope.
 * Boundary: a type only. The tick works out a claim's due runs under its lock, then loads the schedule
 *           (`ScheduleDriver.load`) and pushes those runs in the claimed owner's isolation (ADR 0239 amendment, gap A);
 *           a claim with no owner is a platform row.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 5); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import type { PublicId } from "@stackra/contracts";

import type { Misfire } from "#contracts/enums/misfire.enum";

/** One claimed schedule. */
export interface ScheduleClaim {
  /** The schedule id. */
  readonly id: PublicId<"sch">;

  /** The owning tenant's scope node (`tenant_id`); absent for a platform row. */
  readonly ownerId?: PublicId<"scp">;

  /** The locked key of the job action it runs. */
  readonly key: string;

  /** Its five-field cron expression, read in `timeZone`. */
  readonly cron: string;

  /** Its IANA time zone, or `UTC`. */
  readonly timeZone: string;

  /** What a tick does with runs it missed. */
  readonly misfire: Misfire;

  /** When it was made; no run before it is pushed. */
  readonly createdAt: Date;
}
