/**
 * Stackra file contract:
 * Purpose: `tick(at?)`, one scheduler tick of the testing app compiled last at `at` (the app's clock when absent): it
 *          pushes every cron and schedule run due then, ready for `drainQueue` of @stackra/queue.
 * Boundary: test only; the same `SchedulerService.tick` a deployment runs, through the app's own drivers and lock.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0148 (decisions 4 and 5).
 */
import type { TickResult } from "#core/index";
import { CURRENT_SCHEDULER } from "#testing/constants/current-scheduler.constant";

/**
 * Ticks the current testing app's scheduler.
 *
 * @throws Error before any testing app compiled, or when the app binds no `SchedulerService`.
 * @example
 * await tick(new Date("2026-10-24T12:05:00Z"));
 * await drainQueue(); // runs the ExpireUnpaidOrdersAction the cron pushed
 */
export async function tick(at?: Date): Promise<TickResult> {
  const scheduler = CURRENT_SCHEDULER.value;
  if (scheduler === undefined)
    throw new Error(
      "No scheduler: compile a testing app that binds SchedulerService with createTestingModule(Root).compile() before calling tick()",
    );
  return scheduler.tick(at);
}
