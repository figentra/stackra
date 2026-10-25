/**
 * Stackra file contract:
 * Purpose: `advanceWorkflows`, how the test driver moves the engine's time: it adds `milliseconds` to the current
 *          testing app's offset and ticks at the clock plus that offset until nothing more is due.
 * Boundary: internal to `./testing`; the app's `Clock` itself does not move, so a step reads the tick's instant from
 *           `ctx.now()`. At most a hundred ticks, so a run that keeps itself due cannot hang a test.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0152 (0294 note: timeouts and waits).
 */
import { CURRENT_WORKFLOWS } from "#testing/constants/current-workflows.constant";

/** The most ticks one call runs. */
const MAX_TICKS = 100;

/**
 * Moves the engine's time on by `milliseconds` and runs what became due.
 *
 * @throws Error before any testing app compiled.
 * @example
 * await advanceWorkflows(Duration.toMilliseconds(Duration.minutes(16)));
 */
export async function advanceWorkflows(milliseconds: number): Promise<void> {
  const harness = CURRENT_WORKFLOWS.value;
  if (harness === undefined)
    throw new Error(
      "No testing app: compile one with createTestingModule(Root).compile() before moving workflow time",
    );
  harness.offset += milliseconds;
  const at = new Date(harness.clock.now().getTime() + harness.offset);
  for (let tick = 0; tick < MAX_TICKS; tick += 1)
    // oxlint-disable-next-line no-await-in-loop -- each tick may make the next run due
    if ((await harness.runner.tick(at)) === 0) return;
}
