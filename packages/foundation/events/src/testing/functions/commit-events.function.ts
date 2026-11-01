/**
 * Stackra file contract:
 * Purpose: `commitEvents(events)`, how a testing unit of work hands what its models recorded to the testing app compiled
 *          last once the transaction commits: an integration event is written to the app's outbox, as production's
 *          outbox writer does, and any other event is dispatched on its bus. Both then show in `app.events.published()`
 *          and a `run()` result (STA-1740).
 * Boundary: test only; called by @stackra/database's testing plugin after a commit, never on a rollback, with the
 *           running call (its actor, id and scope) when there is one. Before any
 *           testing app compiled it does nothing, since no app can read the events.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0078 (decisions 3 and 4); ADR 0141 (recorded events reach the outbox
 *                     at flush); ADR 0294 (decision 27).
 */
import { kindOf } from "@stackra/container";

import { newEventId } from "#core/functions/new-event-id.function";
import type { Event } from "#core/index";
import type { CommittingCall } from "#testing/types/committing-call.type";
import { CURRENT_HARNESS } from "#testing/constants/current-harness.constant";

/**
 * Publishes `events`, oldest first, on the current testing app; an integration event carries `call`'s actor, id and
 * scope, so `drainOutbox()` delivers it there (STA-1789).
 *
 * @example
 * await commitEvents(takeRecordedEvents(order));
 */
export async function commitEvents(events: readonly Event[], call?: CommittingCall): Promise<void> {
  const harness = CURRENT_HARNESS.value;
  if (harness === undefined) return;
  for (const event of events)
    if (kindOf(event.constructor)?.kind === "integration_event") {
      const id = newEventId();
      // As production's outbox writer: the call's actor and id travel in the meta, the transaction's scope beside it.
      await harness.outbox.write([
        {
          event,
          meta: {
            id,
            occurredAt: harness.clock.now(),
            ...(call?.actor === undefined ? {} : { actor: call.actor }),
            ...(call?.callId === undefined ? {} : { correlationId: call.callId }),
            ...(call?.scope === undefined ? {} : { scopeId: call.scope.id }),
          },
        },
      ]);
      if (call?.scope !== undefined) harness.scopes.set(id, call.scope);
    } else harness.bus.dispatch(event);
}
