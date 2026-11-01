/**
 * Stackra file contract:
 * Purpose: `deliverInIsolation`, the delivery scope the database testing entry registers for `drainOutbox()`: each
 *          event's delivery runs as the production inbox runs a receipt (STA-1789), in a transaction of its own as the
 *          event's actor in the scope its write ran in (`CallIsolation` when the app binds it), or in `withScope`
 *          without one. An event with no actor runs as the platform, which matches no tenant row.
 * Boundary: test only. Unlike the inbox it trusts the stored actor (no `ScopeOwnership` downgrade): the test wrote it.
 *           A listener failure is a delivery result, so the transaction commits what the others wrote.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0078 (decision 4); ADR 0495 (a background unit's isolation).
 */
import { CallIsolation } from "@stackra/actions/contracts";
import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import type { DeliveryScope } from "@stackra/events/testing";

import { Database } from "#core/ports/database.port";

/** The platform actor of an event that carries none, as the inbox's. */
const PLATFORM_ACTOR: Actor = Object.freeze({ kind: ActorKind.System, id: "sys_inbox" });

/**
 * Runs one event's delivery as the inbox would.
 *
 * @example
 * deliverEventsIn(deliverInIsolation);
 */
export const deliverInIsolation: DeliveryScope = (app, meta, scope, work) => {
  const database = Database.current();
  if (!app.has(CallIsolation)) return database.withScope(scope ?? [], work);
  const isolation = app.get(CallIsolation);
  return database.transaction(
    () => isolation.run(meta.actor ?? PLATFORM_ACTOR, scope, work, { readOnly: false }),
    { requiresNew: true },
  );
};
