/**
 * Stackra file contract:
 * Purpose: `IcalFeed`, what `icalFeed` writes: the product identifier, an optional calendar name, the stamp instant
 *          and the events.
 * Boundary: a type only. `prodId` and every `uid` come from the caller (product settings), never from this package.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 sections 3.4, 3.7 and 3.8.7.2.
 */
import type { IcalEvent } from "#core/types/ical-event.type";

/** A read-only published calendar. */
export interface IcalFeed {
  /** The `PRODID` (`-//Example//Scheduling//EN`). */
  readonly prodId: string;

  /** The display name, written as `X-WR-CALNAME`; left out when absent. */
  readonly name?: string;

  /** The `DTSTAMP` of every event: when the feed was written, ISO 8601 with an offset. */
  readonly stamp: string;

  /** The events, in the order given. */
  readonly events: readonly IcalEvent[];
}
