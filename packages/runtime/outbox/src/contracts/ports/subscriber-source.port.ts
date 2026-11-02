/**
 * Stackra file contract:
 * Purpose: the `SubscriberSource` port: where a producer's cross-app relay learns which consumers in other apps take an
 *          event and where their inboxes are. The first source is the producer's runway configuration; a later one
 *          (the Control Plane) replaces it without touching the relay.
 * Boundary: an abstract class that is its own token, keyed `outbox.SubscriberSource`. Synchronous: a source answers
 *           from what it already holds. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 17, amendment of 2026-11-02); ADR 0142; ADR 0294 (decisions 4, 15
 *                     and 16).
 */
import { Port } from "@stackra/contracts";

import type { Subscriber } from "#contracts/types/subscriber.type";

/**
 * The consumers a producer delivers cross-app events to.
 *
 * @example
 * export class ConfigSubscriberSourceDriver extends Driver(SubscriberSource) {
 *   subscribersOf(type: string): readonly Subscriber[] { ... }
 *   subscriber(member: string): Subscriber | undefined { ... }
 * }
 */
export abstract class SubscriberSource extends Port {
  /** Type-only port key, so `DriverName<SubscriberSource>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.SubscriberSource";

  /** The subscribers that take the event `type` (a wire name); none for an event no other app takes. */
  abstract subscribersOf(type: string): readonly Subscriber[];

  /** The subscriber with the member key `member`; `undefined` once it is no longer listed. */
  abstract subscriber(member: string): Subscriber | undefined;
}
