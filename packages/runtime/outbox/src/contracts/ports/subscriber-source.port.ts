/**
 * Stackra file contract:
 * Purpose: the `SubscriberSource` port: which consumers in other apps take an event type. The cross-app fan-out asks it
 *          per published envelope and the cross-app relay finds a delivery's inbox origin through it.
 * Boundary: an abstract class that is its own token, keyed `outbox.SubscriberSource`. The first driver reads the
 *           producer's runway `events` block (`ConfigSubscriberSourceDriver`); a later one (the Control Plane) needs no relay
 *           change. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 17, amendment of 2026-11-02); ADR 0142 (drivers behind ports).
 */
import { Port } from "@stackra/contracts";

import type { Subscriber } from "#contracts/types/subscriber.type";

/**
 * Where the subscribers of an event type come from.
 *
 * @example
 * export class ControlPlaneSubscriberSource extends Driver(SubscriberSource) {
 *   async subscribersOf(type: string): Promise<readonly Subscriber[]> { ... }
 * }
 */
export abstract class SubscriberSource extends Port {
  /** Type-only port key, so `DriverName<SubscriberSource>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.SubscriberSource";

  /** The subscribers whose events include the versioned wire name `type`; none for a type nobody takes. */
  abstract subscribersOf(type: string): Promise<readonly Subscriber[]>;
}
