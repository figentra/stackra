/**
 * Stackra file contract:
 * Purpose: `Misfire`, what a tick does with the runs of a schedule that came due while no tick ran (the scheduler
 *          was down or late): push each, push one for all of them, or drop them.
 * Boundary: an `Enum.of` value and its type; every policy looks back no further than `SchedulerConfig.catchUpWindow`.
 *           A stored schedule keeps its own; a cron of an action takes `SchedulerConfig.misfire`.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 5: a missed-run policy); ADR 0128 (`Enum.of`, no `enum`).
 */
import { Enum } from "@stackra/contracts";

/**
 * The missed-run policies.
 *
 * @example
 * await scheduler.schedule(SendDigestAction, { scope, cron: "0 8 * * 1", misfire: Misfire.Once });
 */
export const Misfire = Enum.of({
  /** Push one job per missed run, oldest first; the default. */
  CatchUp: "catch_up",
  /** Push one job for every missed run together. */
  Once: "once",
  /** Push only a run of the current minute; missed runs are dropped. */
  Skip: "skip",
});

/** One of the codes above. */
export type Misfire = Enum.Value<typeof Misfire>;
