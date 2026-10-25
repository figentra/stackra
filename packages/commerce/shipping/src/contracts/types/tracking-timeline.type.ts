/**
 * Stackra file contract:
 * Purpose: `TrackingTimeline`, a shipment's normalised history: the current state, the mapped events oldest first,
 *          and the carrier codes the map did not know.
 * Boundary: a type in the leaf entry, produced by `normaliseTracking`. `unmapped` is how a consumer learns its
 *           connector's map needs a new row.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 4).
 */
import type { TrackingState } from "#contracts/enums/tracking-state.enum";
import type { TrackingEvent } from "#contracts/types/tracking-event.type";

/**
 * A normalised history.
 *
 * @example
 * if (timeline.unmapped.length > 0) alertConnectorOwner(provider, timeline.unmapped);
 */
export interface TrackingTimeline {
  /** The state of the latest mapped event; `null` before any. */
  readonly state: TrackingState | null;

  /** The mapped events, oldest first, each code and instant once. */
  readonly events: readonly TrackingEvent[];

  /** Carrier codes with no row in the map, each once, in the order first seen. */
  readonly unmapped: readonly string[];
}
