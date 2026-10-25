/**
 * Stackra file contract:
 * Purpose: `recordEvent`, how an aggregate records a fact for after commit: a model's `record(event)` and a
 *          workflow step's `ctx.record(event)` call it, and the unit of work takes the events at commit.
 * Boundary: stores the event beside the aggregate, never on it (ADR 0294 decision 27); it dispatches nothing. The unit
 *           of work dispatches domain events in process and writes integration events to the `EventOutbox`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 27); ADR 0078 (decision 4); ADR 0141 (decision 3).
 */
import type { Event } from "#core/bases/event.base";
import { RECORDED_EVENTS } from "#core/constants/recorded-events.constant";

/**
 * Records `event` on `aggregate`, after the events it recorded before.
 *
 * @example
 * recordEvent(order, OrderPaid.create({ orderId: order.id, paymentId }));
 */
export function recordEvent(aggregate: object, event: Event): void {
  const events = RECORDED_EVENTS.get(aggregate) ?? [];
  events.push(event);
  RECORDED_EVENTS.set(aggregate, events);
}
