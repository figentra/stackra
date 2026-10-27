/**
 * Stackra file contract:
 * Purpose: the `RegionBus` port: carries committed platform events from the region that raised them to every other
 *          region of the same environment (a plan catalogue approved once and copied read-only per region, STA-1268).
 * Boundary: an abstract class that is its own token. It moves `RecordedEvent`s only; which events it is given is
 *           `crossRegionRecords` (`.`), and which peers exist, and how bytes cross, are the driver's, bound per region
 *           from the root runway. The receiving region hands each record to its own inbox under the same event id,
 *           so a copy is processed once and never re-sent. No tenant data crosses (ADR 0353 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0353 (decisions 5 and 6); ADR 0142 (transport behind a driver); ADR 0078 (decision 4);
 *                     STA-1268 (the transport itself awaits its ADR, root runway).
 */
import { Port } from "@stackra/contracts";

import type { RecordedEvent } from "#contracts/types/recorded-event.type";

/**
 * Sends committed platform events to the other regions.
 *
 * @example
 * export class PubSubRegionBusDriver extends Driver(RegionBus) {
 *   async send(records: readonly RecordedEvent[]): Promise<void> {
 *     for (const peer of this.peers) await peer.topic.publish(records.map(toEnvelope));
 *   }
 * }
 */
export abstract class RegionBus extends Port {
  /** Sends `records`, in order, to every other region of the environment; resolves once each peer accepted them. */
  abstract send(records: readonly RecordedEvent[]): Promise<void>;
}
