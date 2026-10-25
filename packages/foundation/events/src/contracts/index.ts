/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/events (the `EventOutbox` port and the types of a
 *          recorded event) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { EventOutbox } from "#contracts/ports/event-outbox.port";
export type { EventMeta } from "#contracts/types/event-meta.type";
export type { RecordedEvent } from "#contracts/types/recorded-event.type";
