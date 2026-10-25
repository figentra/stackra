/**
 * Stackra file contract:
 * Purpose: `TrackingEvent`, a carrier event with the normalised state its code maps to.
 * Boundary: a type in the leaf entry, produced by `normaliseTracking`.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 4).
 */
import type { TrackingState } from "#contracts/enums/tracking-state.enum";
import type { CarrierEvent } from "#contracts/types/carrier-event.type";

/**
 * A normalised event.
 *
 * @example
 * const delivered = timeline.events.find((event) => event.state === TrackingState.Delivered);
 */
export interface TrackingEvent extends CarrierEvent {
  /** The state the carrier's code maps to. */
  readonly state: TrackingState;
}
