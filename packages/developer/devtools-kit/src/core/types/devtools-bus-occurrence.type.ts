/**
 * Stackra file contract:
 * Purpose: `DevtoolsBusOccurrence`, the payload of a `DEVTOOLS_BUS_CHANNEL` event: one event the in-process bus
 *          delivered, its class name and its metadata.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decision 3: events in the dev console); ADR 0294 (decision 27: metadata travels
 *                     beside the event).
 */
import type { Event, ListenerContext } from "@stackra/events";

/** One delivered event. */
export interface DevtoolsBusOccurrence {
  /** The event's class name (`OrderPaid`). */
  readonly type: string;

  /** The event: its payload fields only. */
  readonly event: Event;

  /** Its id, time, tenant, actor and causation. */
  readonly context: Omit<ListenerContext, "now">;
}
