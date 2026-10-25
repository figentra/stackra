/**
 * Stackra file contract:
 * Purpose: `takeRecordedEvents`, how the unit of work collects what an aggregate recorded at commit: it returns the
 *          events in record order and forgets them, so a second commit never ships them again.
 * Boundary: reads and clears the recording only; dispatching and the outbox write are the caller's.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 27); ADR 0078 (decision 4).
 */
import type { Event } from "#core/bases/event.base";
import { RECORDED_EVENTS } from "#core/constants/recorded-events.constant";

/**
 * The events `aggregate` recorded since the last take, oldest first; `[]` when it recorded none.
 *
 * @example
 * for (const entity of unitOfWork.changed()) pending.push(...takeRecordedEvents(entity));
 */
export function takeRecordedEvents(aggregate: object): readonly Event[] {
  const events = RECORDED_EVENTS.get(aggregate) ?? [];
  RECORDED_EVENTS.delete(aggregate);
  return Object.freeze(events);
}
