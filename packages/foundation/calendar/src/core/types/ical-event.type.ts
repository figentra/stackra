/**
 * Stackra file contract:
 * Purpose: `IcalEvent`, one VEVENT of a feed written by `icalFeed`: a globally unique id, its span, a title and a
 *          status.
 * Boundary: a type only. Instants are ISO 8601 with an offset and are written in UTC. The caller picks the title and
 *           keeps personal data out of it.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.6.1.
 */
import type { IcalStatus } from "#core/enums/ical-status.enum";

/** One event of a feed. */
export interface IcalEvent {
  /** The globally unique `UID`, written as given (`bkg_1@scheduling.example.com`). */
  readonly uid: string;

  /** The first instant, ISO 8601 with an offset. */
  readonly start: string;

  /** The instant the event ends, ISO 8601 with an offset; after `start`. */
  readonly end: string;

  /** The `SUMMARY`. */
  readonly summary: string;

  /** The `STATUS`; left out when absent. */
  readonly status?: IcalStatus;
}
