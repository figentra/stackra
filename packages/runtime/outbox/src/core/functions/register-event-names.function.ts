/**
 * Stackra file contract:
 * Purpose: `registerEventNames`, how gen's generated entry tells the outbox the locked wire name of each integration
 *          event, so the writer stores `orders.order.paid.v1` and an inbox in another process rebuilds the class from it.
 * Boundary: writes the process-wide `EVENT_NAMES`; a later row for a class replaces its earlier name. Checks each row,
 *           so a wrong row fails at boot rather than on the first event. A row may name a consumed service's event
 *           class from `#stackra/clients/<service>` (typed by its payload, an integration event at runtime), so a
 *           consumer's inbox rebuilds it: the kind check, not the static type, decides.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (2026-10-23 note); ADR 0294 (decisions 10, 20 and 22); ADR 0260 (decision 4); the queue precedent
 *                     (`registerJobs`).
 */
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { Event } from "@stackra/events";

import { EVENT_NAMES } from "#core/constants/event-names.constant";

/**
 * Registers the integration events with their locked wire names.
 *
 * @throws TypeError when a row's class is not an integration event, its name is empty, or another class has its name.
 * @example
 * registerEventNames([{ type: OrderPaid, name: "orders.order.paid.v1" }]);
 */
export function registerEventNames(
  rows: readonly { readonly type: AnyClass; readonly name: string }[],
): void {
  for (const row of rows) {
    const type = row.type as AnyClass<Event>;
    const { name } = row;
    if (kindOf(type)?.kind !== "integration_event")
      throw new TypeError(`registerEventNames: ${type.name} is not an integration event`);
    if (typeof name !== "string" || name === "")
      throw new TypeError(`registerEventNames: ${type.name} needs its locked wire name`);
    const holder = EVENT_NAMES.byName.get(name);
    if (holder !== undefined && holder !== type)
      throw new TypeError(
        `registerEventNames: ${type.name} and ${holder.name} share the wire name ${name}`,
      );
    const previous = EVENT_NAMES.names.get(type);
    if (previous !== undefined) EVENT_NAMES.byName.delete(previous);
    EVENT_NAMES.byName.set(name, type);
    EVENT_NAMES.names.set(type, name);
  }
}
