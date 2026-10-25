/**
 * Stackra file contract:
 * Purpose: `EVENT_NAMES`, the integration events this process can write and read, both ways: the wire name of each
 *          class for the writers, and the class of each wire name for the inbox that rebuilds a received event.
 * Boundary: process-wide and internal: written by `registerEventNames` (gen's entry, with the locked wire names) and by
 *           `eventName` for a class written before any registration (with its written name), read by the inbox.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (2026-10-23 note: gen adds the module key and the version); ADR 0294 (decisions 20 and
 *                     22: locked identities).
 */
import type { AnyClass } from "@stackra/container";
import type { Event } from "@stackra/events";

/** The registered integration events. */
export const EVENT_NAMES = Object.freeze({
  /** Wire name to event class. */
  byName: new Map<string, AnyClass<Event>>(),

  /** Event class to wire name. */
  names: new Map<AnyClass<Event>, string>(),
});
