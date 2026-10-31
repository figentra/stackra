/**
 * Stackra file contract:
 * Purpose: `commitEvents(events)`, how a testing unit of work hands what its models recorded to the testing app compiled
 *          last once the transaction commits: an integration event is written to the app's outbox, as production's
 *          outbox writer does, and any other event is dispatched on its bus. Both then show in `app.events.published()`
 *          and a `run()` result (STA-1740).
 * Boundary: test only; called by @stackra/database's testing plugin after a commit, never on a rollback. Before any
 *           testing app compiled it does nothing, since no app can read the events.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0078 (decisions 3 and 4); ADR 0141 (recorded events reach the outbox
 *                     at flush); ADR 0294 (decision 27).
 */
import { kindOf } from "@stackra/container";

import { newEventId } from "#core/functions/new-event-id.function";
import type { Event } from "#core/index";
import { CURRENT_HARNESS } from "#testing/constants/current-harness.constant";

/**
 * Publishes `events`, oldest first, on the current testing app.
 *
 * @example
 * await commitEvents(takeRecordedEvents(order));
 */
export async function commitEvents(events: readonly Event[]): Promise<void> {
  const harness = CURRENT_HARNESS.value;
  if (harness === undefined) return;
  for (const event of events)
    if (kindOf(event.constructor)?.kind === "integration_event")
      await harness.outbox.write([
        { event, meta: { id: newEventId(), occurredAt: harness.clock.now() } },
      ]);
    else harness.bus.dispatch(event);
}
