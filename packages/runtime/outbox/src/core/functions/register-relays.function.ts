/**
 * Stackra file contract:
 * Purpose: `registerRelays`, how gen's registrations name the relay listeners of a member: each listener whose `handle`
 *          parameter is typed `EventEnvelope` (from `@stackra/outbox/contracts`), which the inbox hands every claimed
 *          envelope.
 * Boundary: writes the process-wide `RELAYS`; a class registered again is kept once. Nothing receives until an inbox
 *           `connect`s to a container, which resolves the instances.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 4); ADR 0141 (decision 2: the envelope); the `registerListeners` precedent.
 */
import type { ListenerClass } from "@stackra/events";

import { RELAYS } from "#core/constants/relays.constant";

/**
 * Registers relay listeners.
 *
 * @example
 * registerRelays([WebhooksRelayListener]);
 */
export function registerRelays(listeners: readonly ListenerClass[]): void {
  for (const listener of listeners) RELAYS.add(listener);
}
