/**
 * Stackra file contract:
 * Purpose: `SCHEDULER_CONFIG_SCHEMA`, the zod schema this package ships for `SchedulerConfig` (exported as
 *          `SchedulerConfig$`): which driver stores the schedules, how far back a tick catches up missed runs (one
 *          minute to one day), and the missed-run policy a schedule takes when it names none.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `SchedulerConfig$` can `.extend` it. The defaults equal
 *           `SchedulerOptions`' initializers (tested). No credential: the Postgres driver uses the service's own
 *           database connection.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config);
 *                     ADR 0148 (decision 5).
 */
import { Duration, Enum } from "@stackra/contracts";
import { z } from "zod";

import { Misfire } from "#contracts/enums/misfire.enum";
import { SCHEDULE_DRIVERS } from "#core/constants/schedule-drivers.constant";

/** The shortest catch-up window: one tick. */
const MIN_WINDOW_MS = 60_000;

/** The longest catch-up window: one day, so a tick steps at most 1,440 minutes per schedule. */
const MAX_WINDOW_MS = 86_400_000;

/** Whether `value` is a `Duration` from one minute to one day. */
function isWindow(value: unknown): value is Duration {
  if (typeof value !== "string") return false;
  try {
    const milliseconds = Duration.toMilliseconds(value as Duration);
    return milliseconds >= MIN_WINDOW_MS && milliseconds <= MAX_WINDOW_MS;
  } catch {
    return false;
  }
}

/** The shipped `SchedulerConfig$`. */
export const SCHEDULER_CONFIG_SCHEMA = z.object({
  driver: z.enum(SCHEDULE_DRIVERS).default("postgres"),
  catchUpWindow: z
    .custom<Duration>(isWindow, { message: "catchUpWindow is a Duration from 1m to 1d" })
    .default(Duration.hours(1)),
  misfire: z.enum(Enum.values(Misfire) as [Misfire, ...Misfire[]]).default(Misfire.CatchUp),
});
