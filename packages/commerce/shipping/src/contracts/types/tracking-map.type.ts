/**
 * Stackra file contract:
 * Purpose: `TrackingMap`, one carrier's event codes to normalised `TrackingState`s.
 * Boundary: a type in the leaf entry. The map is data that ships with the connector's provider description and can be
 *           corrected without a release; a code missing from it is reported, never guessed.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 4); ADR 0363 (decision 1).
 */
import type { TrackingState } from "#contracts/enums/tracking-state.enum";

/**
 * Carrier code to state.
 *
 * @example
 * const map: TrackingMap = { PU: TrackingState.InTransit, OFD: TrackingState.OutForDelivery };
 */
export type TrackingMap = Readonly<Record<string, TrackingState>>;
