/**
 * Stackra file contract:
 * Purpose: `deliverRemoteEvent(EventClass, fields, meta?)`, which puts an event another service published into the
 *          memory inbox of the testing app compiled last; `drainOutbox()` then delivers it to its listeners.
 * Boundary: builds the event with `EventClass.create`, so its fields are checked by its generated schema (a consumed
 *           service's event class from `#stackra/clients/<service>` checks them with its payload schema). An event
 *           delivered again with the same `id` runs no listener (inbox dedup); one with no `id` is always new.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0260 (decisions 3 and 4: events across services, typed by import); ADR 0078 (decision 4).
 */
import type { Fields } from "@stackra/validation";

import type { EventMeta } from "#contracts/index";
import type { Event, EventClass } from "#core/index";
import { currentHarness } from "#testing/functions/current-harness.function";

/**
 * Receives a remote event into the current app's inbox.
 *
 * @param type - the event's class, as gen writes it into `#stackra/clients/<service>`.
 * @param values - its fields.
 * @param meta - the occurrence's metadata; `id` deduplicates, `connection` marks a tenant connection's webhook.
 * @returns the built event.
 * @throws Error when no testing app has been compiled.
 * @example
 * await deliverRemoteEvent(OrderPaid, paid, { id: "evt_1" });
 * await drainOutbox();
 */
export function deliverRemoteEvent<E extends Event>(
  type: EventClass<E>,
  values: Fields<E>,
  meta?: Partial<EventMeta>,
): Promise<E>;
/** A consumed service's event class, as gen writes it into `#stackra/clients/<service>`. */
export function deliverRemoteEvent<E extends object, V>(
  type: { readonly eventName: string; create(values: V): E },
  values: V,
  meta?: Partial<EventMeta>,
): Promise<E>;
export async function deliverRemoteEvent(
  type: { create(values: never): object },
  values: unknown,
  meta: Partial<EventMeta> = {},
): Promise<object> {
  const event = type.create(values as never);
  currentHarness().inbox.push({ event: event as Event, meta });
  return event;
}
