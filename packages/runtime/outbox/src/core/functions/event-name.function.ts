/**
 * Stackra file contract:
 * Purpose: `eventName`, the wire name an integration event class is stored and published under: its registered
 *          locked name, else its written name with the version (`order.paid.v1`), which it then registers so this
 *          process's inbox can rebuild it.
 * Boundary: internal; called by the writers. The written name lacks the module key gen adds, so a service without
 *           gen's registration publishes the short form; the inbox of the same process still finds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (decision 1 and the 2026-10-23 note); ADR 0294 (decision 20).
 */
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { Event } from "@stackra/events";

import { EVENT_NAMES } from "#core/constants/event-names.constant";
import { registerEventNames } from "#core/functions/register-event-names.function";

/**
 * The wire name of `type`.
 *
 * @throws TypeError when `type` is not an integration event, or its written name is another class's.
 * @example
 * eventName(OrderPaid); // "orders.order.paid.v1" once gen registered it, else "order.paid.v1"
 */
export function eventName(type: AnyClass<Event>): string {
  const registered = EVENT_NAMES.names.get(type);
  if (registered !== undefined) return registered;
  const record = kindOf(type);
  if (record?.kind !== "integration_event")
    throw new TypeError(
      `${type.name} is not an integration event: only an integration event goes through the outbox`,
    );
  const name = `${String(record.options["name"])}.v${String(record.options["version"])}`;
  registerEventNames([{ type, name }]);
  return name;
}
