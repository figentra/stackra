/**
 * Stackra file contract:
 * Purpose: `dispatch(event, meta?)`, which publishes an event in process on the testing app compiled last, as the
 *          unit of work does after commit; `drainEvents()` then runs its listeners.
 * Boundary: queues only: no listener runs until a drain, so a test proves a reaction waits for the flush.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0078 (decision 4: listeners run after commit).
 */
import type { EventMeta, RecordedEvent } from "#contracts/index";
import type { Event } from "#core/index";
import { currentHarness } from "#testing/functions/current-harness.function";

/**
 * Publishes `event` on the current app's bus.
 *
 * @param meta - the occurrence's metadata; a fresh id and the clock's time when absent.
 * @returns the queued occurrence.
 * @throws Error when no testing app has been compiled.
 * @example
 * await dispatch(PointsEarned.create({ memberId, points: 10, reference: "ord_small", tier, balanceAfter: 600 }));
 * await drainEvents();
 */
export async function dispatch(
  event: Event,
  meta: Partial<EventMeta> = {},
): Promise<RecordedEvent<Event>> {
  return currentHarness().bus.dispatch(event, meta);
}
